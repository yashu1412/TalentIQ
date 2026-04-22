from src.core.feature_flags import get_flags


def test_feature_flags_shape():
    flags = get_flags()
    assert "copilot_enabled" in flags
    assert "live_room_enabled" in flags
    assert "resume_pipeline_enabled" in flags
    assert "interview_replay_enabled" in flags

