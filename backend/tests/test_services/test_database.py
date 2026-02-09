from app.database import Base


def test_naming_convention_on_metadata() -> None:
    """Base.metadata should have the naming convention configured."""
    convention = Base.metadata.naming_convention
    assert "ix" in convention
    assert "uq" in convention
    assert "ck" in convention
    assert "fk" in convention
    assert "pk" in convention


def test_naming_convention_uses_correct_prefixes() -> None:
    """Naming convention should use ix_, uq_, ck_, fk_, pk_ prefixes."""
    convention = Base.metadata.naming_convention
    assert convention["ix"].startswith("ix_")  # type: ignore[union-attr]
    assert convention["uq"].startswith("uq_")  # type: ignore[union-attr]
    assert convention["ck"].startswith("ck_")  # type: ignore[union-attr]
    assert convention["fk"].startswith("fk_")  # type: ignore[union-attr]
    assert convention["pk"].startswith("pk_")  # type: ignore[union-attr]
