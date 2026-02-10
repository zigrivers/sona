"""Merge service — orchestrates LLM-based voice DNA merging."""

import json
from typing import Any, cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import MergeFailedError
from app.llm.base import LLMProvider
from app.llm.prompts import build_merge_prompt
from app.models.clone import MergedCloneSource, VoiceClone
from app.models.dna import VoiceDNAVersion
from app.services.dna_service import DNAService


class MergeService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def merge(
        self,
        name: str,
        source_clones: list[dict[str, Any]],
        provider: LLMProvider,
        *,
        model: str,
    ) -> VoiceClone:
        """Merge multiple voice clones into a new blended clone.

        Args:
            name: Name for the merged clone.
            source_clones: List of {clone_id, weights: {category: 0-100}}.
            provider: LLM provider for the merge call.
            model: Model identifier to use.

        Returns:
            The newly created merged VoiceClone.

        Raises:
            CloneNotFoundError: If any source clone doesn't exist.
            ValueError: If a source clone has no DNA.
            MergeFailedError: If the LLM call fails.
        """
        dna_svc = DNAService(self._session)

        # 1. Validate all source clones exist and load their DNA
        source_dnas: list[dict[str, object]] = []
        for src in source_clones:
            clone_id = src["clone_id"]
            weights = src["weights"]

            # Validate clone exists (raises CloneNotFoundError)
            from app.services.clone_service import CloneService

            clone_svc = CloneService(self._session)
            clone = await clone_svc.get_by_id(clone_id)

            # Load current DNA
            dna = await dna_svc.get_current(clone_id)
            if dna is None:
                msg = f"Source clone '{clone.name}' has no DNA"
                raise ValueError(msg)

            dna_data = cast(dict[str, Any], dna.data)  # pyright: ignore[reportUnknownMemberType]
            source_dnas.append(
                {
                    "name": clone.name,
                    "dna_data": dna_data,
                    "weights": weights,
                }
            )

        # 2. Build prompt and call LLM
        messages = build_merge_prompt(source_dnas)

        try:
            raw_response = await provider.complete(messages, model=model)
        except Exception as exc:
            raise MergeFailedError(reason=str(exc)) from exc

        # 3. Parse response
        try:
            parsed = json.loads(raw_response)
        except json.JSONDecodeError as exc:
            raise MergeFailedError(reason=f"Invalid JSON response: {exc}") from exc

        dna_data_result = parsed.get("dna", parsed)
        prominence_scores = parsed.get("prominence_scores")

        # 4. Create merged clone
        merged_clone = VoiceClone(name=name, type="merged")
        self._session.add(merged_clone)
        await self._session.flush()

        # 5. Create DNA version
        dna_version = VoiceDNAVersion(
            clone_id=merged_clone.id,
            version_number=1,
            data=dna_data_result,
            prominence_scores=prominence_scores,
            trigger="merge",
            model_used=model,
        )
        self._session.add(dna_version)

        # 6. Create lineage records
        for src in source_clones:
            lineage = MergedCloneSource(
                merged_clone_id=merged_clone.id,
                source_clone_id=src["clone_id"],
                weights=src["weights"],
            )
            self._session.add(lineage)

        await self._session.flush()
        return merged_clone
