import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client(monkeypatch):
    baseline_activities = copy.deepcopy(app_module.activities)
    monkeypatch.setattr(app_module, "activities", copy.deepcopy(baseline_activities))

    with TestClient(app_module.app) as test_client:
        yield test_client