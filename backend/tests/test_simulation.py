"""
Unit & Integration Tests for Adaptive Signal Controller & Priority Formulas
Can be executed with either:
  python -m unittest discover -s backend/tests
or:
  pytest backend/tests
"""

import unittest
import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.algorithms.adaptive_controller import AdaptiveSignalControllerPy


class TestAdaptiveController(unittest.TestCase):
    def test_priority_score_calculation(self):
        controller = AdaptiveSignalControllerPy(
            weight_count=0.45,
            weight_queue=0.30,
            weight_wait=0.25,
        )

        # Empty road
        score_empty = controller.calculate_priority_score(count=0, queue=0, wait_time=0.0)
        self.assertEqual(score_empty, 0.0)

        # Maxed road
        score_max = controller.calculate_priority_score(count=25, queue=15, wait_time=60.0)
        self.assertAlmostEqual(score_max, 1.0, places=2)

        # Emergency road has heavy priority boost
        score_emergency = controller.calculate_priority_score(
            count=5, queue=2, wait_time=10.0, has_emergency=True
        )
        self.assertGreater(score_emergency, 2.0)

    def test_no_conflicting_greens(self):
        controller = AdaptiveSignalControllerPy()

        # Step through simulation for 100 seconds
        for _ in range(100):
            controller.tick(
                dt=1.0,
                traffic_data={
                    "north": {"vehicle_count": 10, "queue_length": 5, "average_waiting_time": 15.0},
                    "south": {"vehicle_count": 12, "queue_length": 6, "average_waiting_time": 14.0},
                    "east": {"vehicle_count": 4, "queue_length": 1, "average_waiting_time": 5.0},
                    "west": {"vehicle_count": 3, "queue_length": 1, "average_waiting_time": 6.0},
                },
            )
            signals = controller.get_signals()

            # Check safety interlock: North/South and East/West must NEVER both be GREEN
            ns_green = signals["north"] == "GREEN" or signals["south"] == "GREEN"
            ew_green = signals["east"] == "GREEN" or signals["west"] == "GREEN"

            self.assertFalse(
                ns_green and ew_green,
                "Safety violation: Conflicting greens active simultaneously!",
            )

    def test_dynamic_green_boundaries(self):
        controller = AdaptiveSignalControllerPy(min_green=10, max_green=60)

        # Force transition by draining remaining time
        controller.time_remaining = 0
        controller._transition({
            "north": {"vehicle_count": 25, "queue_length": 15, "average_waiting_time": 60.0},
            "south": {"vehicle_count": 25, "queue_length": 15, "average_waiting_time": 60.0},
            "east": {"vehicle_count": 0, "queue_length": 0, "average_waiting_time": 0.0},
            "west": {"vehicle_count": 0, "queue_length": 0, "average_waiting_time": 0.0},
        })

        # When all-red transitions to green, allocated green must respect [min_green, max_green]
        controller.time_remaining = 0
        controller._transition({})
        controller.time_remaining = 0
        controller._transition({})

        self.assertGreaterEqual(controller.allocated_green, 10)
        self.assertLessEqual(controller.allocated_green, 60)


if __name__ == "__main__":
    unittest.main()
