"""Voice DNA analysis service — orchestrates LLM analysis and version management."""

import json
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import MAX_DNA_VERSIONS
from app.exceptions import AnalysisFailedError, CloneNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_dna_analysis_prompt
from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings

_CATEGORY_TEMPLATES: dict[str, tuple[str, dict[str, str]]] = {
    "vocabulary": (
        "Vocabulary",
        {
            "complexity_level": "Uses {v} complexity",
            "jargon_usage": "with {v} jargon",
            "contraction_frequency": "Contractions are {v}",
            "word_choice_patterns": "Word choice patterns: {v}",
        },
    ),
    "sentence_structure": (
        "Sentence Structure",
        {
            "average_length": "{v} average sentence length",
            "complexity_variation": "{v} complexity variation",
            "fragment_usage": "{v} fragment usage",
            "patterns": "Patterns: {v}",
        },
    ),
    "paragraph_structure": (
        "Paragraph Structure",
        {
            "average_length": "{v} average paragraph length",
            "transition_style": "{v} transition style",
            "organization": "{v} organization",
        },
    ),
    "tone": (
        "Tone",
        {
            "formality_level": "{v} formality",
            "warmth": "{v} warmth",
            "primary_tone": "Primary tone is {v}",
            "secondary_tone": "secondary tone is {v}",
        },
    ),
    "rhetorical_devices": (
        "Rhetorical Devices",
        {
            "metaphor_usage": "{v} metaphor usage",
            "repetition_patterns": "{v} repetition patterns",
            "rhetorical_questions": "{v} rhetorical questions",
            "storytelling_tendency": "{v} storytelling tendency",
        },
    ),
    "punctuation": (
        "Punctuation",
        {
            "em_dash_frequency": "{v} em dash frequency",
            "semicolon_usage": "{v} semicolon usage",
            "exclamation_points": "{v} exclamation points",
            "parenthetical_asides": "{v} parenthetical asides",
            "ellipsis_usage": "{v} ellipsis usage",
        },
    ),
    "openings_and_closings": (
        "Openings & Closings",
        {
            "opening_patterns": "Opening patterns: {v}",
            "hook_style": "{v} hook style",
            "closing_patterns": "Closing patterns: {v}",
            "cta_style": "{v} call-to-action style",
        },
    ),
    "humor": (
        "Humor",
        {
            "frequency": "{v} humor frequency",
            "types": "Humor types: {v}",
            "placement": "{v} humor placement",
        },
    ),
    "signatures": (
        "Signatures",
        {
            "catchphrases": "Known catchphrases include {v}",
            "recurring_themes": "Recurring themes: {v}",
            "unique_mannerisms": "Unique mannerisms: {v}",
        },
    ),
}


class DNAService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def analyze(
        self,
        clone_id: str,
        provider: LLMProvider,
        *,
        model: str,
    ) -> VoiceDNAVersion:
        """Run Voice DNA analysis on a clone's writing samples.

        Sends all samples + methodology instructions to the LLM, parses the
        structured JSON response, and creates a new VoiceDNAVersion.
        """
        # Load clone with samples
        stmt = select(VoiceClone).where(VoiceClone.id == clone_id)
        result = await self._session.execute(stmt)
        clone = result.scalar_one_or_none()
        if clone is None:
            raise CloneNotFoundError(clone_id)

        if not clone.samples:
            msg = f"Clone '{clone_id}' has no writing samples"
            raise ValueError(msg)

        # Gather sample texts
        sample_texts = [s.content for s in clone.samples]

        # Load methodology content
        methodology_stmt = select(MethodologySettings).where(
            MethodologySettings.section_key == "voice_cloning"
        )
        methodology_result = await self._session.execute(methodology_stmt)
        methodology = methodology_result.scalar_one_or_none()
        methodology_content = methodology.current_content if methodology else None

        # Build prompt and call LLM
        messages = build_dna_analysis_prompt(sample_texts, methodology=methodology_content)

        try:
            raw_response = await provider.complete(messages, model=model)
        except Exception as exc:
            raise AnalysisFailedError(
                provider=type(provider).__name__,
                reason=str(exc),
            ) from exc

        # Parse response
        try:
            parsed = json.loads(raw_response)
        except json.JSONDecodeError as exc:
            raise AnalysisFailedError(
                provider=type(provider).__name__,
                reason=f"Invalid JSON response: {exc}",
            ) from exc

        dna_data = parsed.get("dna", parsed)
        prominence_scores = parsed.get("prominence_scores")
        consistency_score = parsed.get("consistency_score")
        if consistency_score is not None:
            dna_data["consistency_score"] = consistency_score

        # Determine version number and trigger
        version_number = await self._next_version_number(clone_id)
        trigger = "initial_analysis" if version_number == 1 else "regeneration"

        dna_version = VoiceDNAVersion(
            clone_id=clone_id,
            version_number=version_number,
            data=dna_data,
            prominence_scores=prominence_scores,
            trigger=trigger,
            model_used=model,
        )
        self._session.add(dna_version)
        await self._session.flush()

        await self._prune_versions(clone_id)
        return dna_version

    async def manual_edit(
        self,
        clone_id: str,
        *,
        data: dict[str, Any],
        prominence_scores: dict[str, Any] | None = None,
    ) -> VoiceDNAVersion:
        """Create a new DNA version from manual edits."""
        current = await self.get_current(clone_id)
        if current is None:
            msg = f"Clone '{clone_id}' has no existing DNA to edit"
            raise ValueError(msg)

        version_number = await self._next_version_number(clone_id)
        dna_version = VoiceDNAVersion(
            clone_id=clone_id,
            version_number=version_number,
            data=data,
            prominence_scores=prominence_scores,
            trigger="manual_edit",
            model_used="manual",
        )
        self._session.add(dna_version)
        await self._session.flush()

        await self._prune_versions(clone_id)
        return dna_version

    async def revert(self, clone_id: str, target_version: int) -> VoiceDNAVersion:
        """Revert DNA to a previous version (creates a new version, non-destructive)."""
        stmt = select(VoiceDNAVersion).where(
            VoiceDNAVersion.clone_id == clone_id,
            VoiceDNAVersion.version_number == target_version,
        )
        result = await self._session.execute(stmt)
        old_version = result.scalar_one_or_none()
        if old_version is None:
            msg = f"Version {target_version} not found for clone '{clone_id}'"
            raise ValueError(msg)

        version_number = await self._next_version_number(clone_id)
        old_data = cast(dict[str, Any], old_version.data)  # pyright: ignore[reportUnknownMemberType]
        old_scores = cast(dict[str, Any] | None, old_version.prominence_scores)  # pyright: ignore[reportUnknownMemberType]
        dna_version = VoiceDNAVersion(
            clone_id=clone_id,
            version_number=version_number,
            data=old_data,
            prominence_scores=old_scores,
            trigger="revert",
            model_used=old_version.model_used,
        )
        self._session.add(dna_version)
        await self._session.flush()

        await self._prune_versions(clone_id)
        return dna_version

    async def get_current(self, clone_id: str) -> VoiceDNAVersion | None:
        """Return the latest DNA version for a clone, or None."""
        stmt = (
            select(VoiceDNAVersion)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_versions(self, clone_id: str) -> list[VoiceDNAVersion]:
        """Return all DNA versions for a clone, newest first."""
        stmt = (
            select(VoiceDNAVersion)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    # ── Export ─────────────────────────────────────────────────────

    @staticmethod
    def export_as_prompt(data: dict[str, Any]) -> str:
        """Convert a DNA data dict into a natural language prompt string."""
        sections: list[str] = []
        for cat_key, (label, field_templates) in _CATEGORY_TEMPLATES.items():
            cat_data = data.get(cat_key)
            if not cat_data or not isinstance(cat_data, dict):
                continue
            parts: list[str] = []
            for field_key, template in field_templates.items():
                value = cat_data.get(field_key)
                if value is None:
                    continue
                if isinstance(value, list):
                    if not value:
                        continue
                    formatted = ", ".join(f'"{item}"' for item in value)
                else:
                    formatted = str(value)
                parts.append(template.format(v=formatted))
            if parts:
                sections.append(f"{label}: {'. '.join(parts)}.")

        body = "\n\n".join(sections)
        return f"Write in a style that matches the following voice DNA profile:\n\n{body}"

    # ── Helpers ────────────────────────────────────────────────────

    async def _next_version_number(self, clone_id: str) -> int:
        """Return the next version number for a clone's DNA."""
        stmt = (
            select(VoiceDNAVersion.version_number)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def _prune_versions(self, clone_id: str) -> None:
        """Delete oldest versions if count exceeds MAX_DNA_VERSIONS."""
        stmt = (
            select(VoiceDNAVersion)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
        )
        result = await self._session.execute(stmt)
        versions = list(result.scalars().all())

        if len(versions) > MAX_DNA_VERSIONS:
            for v in versions[MAX_DNA_VERSIONS:]:
                await self._session.delete(v)
            await self._session.flush()
