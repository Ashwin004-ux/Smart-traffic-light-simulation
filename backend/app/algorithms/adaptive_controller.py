"""
Adaptive Signal Controller Implementation in Python
Enforces weighted priority calculation, safe state machine transitions,
starvation prevention, and emergency vehicle preemption.
"""

from typing import Dict, Any


class AdaptiveSignalControllerPy:
    def __init__(
        self,
        weight_count: float = 0.45,
        weight_queue: float = 0.30,
        weight_wait: float = 0.25,
        min_green: int = 10,
        max_green: int = 60,
        yellow: int = 3,
        all_red: int = 2,
    ):
        self.w1 = weight_count
        self.w2 = weight_queue
        self.w3 = weight_wait
        self.min_green = min_green
        self.max_green = max_green
        self.yellow = yellow
        self.all_red = all_red

        self.current_phase = "NORTH_SOUTH"
        self.phase_state = "GREEN"  # GREEN, YELLOW, ALL_RED
        self.time_remaining = float(min_green + 10)
        self.allocated_green = float(min_green + 10)
        self.consecutive_rounds = {"NORTH_SOUTH": 0, "EAST_WEST": 0}
        self.max_consecutive = 3

    def calculate_priority_score(self, count: int, queue: int, wait_time: float, has_emergency: bool = False) -> float:
        """
        Priority Score = (w1 * NormCount) + (w2 * NormQueue) + (w3 * NormWait)
        """
        norm_count = min(1.0, count / 25.0)
        norm_queue = min(1.0, queue / 15.0)
        norm_wait = min(1.0, wait_time / 60.0)

        score = (self.w1 * norm_count) + (self.w2 * norm_queue) + (self.w3 * norm_wait)
        if has_emergency:
            score += 2.0
        return round(score, 4)

    def get_signals(self) -> Dict[str, str]:
        signals = {"north": "RED", "south": "RED", "east": "RED", "west": "RED"}
        if self.phase_state == "ALL_RED":
            return signals

        if self.current_phase == "NORTH_SOUTH":
            signals["north"] = self.phase_state
            signals["south"] = self.phase_state
        else:
            signals["east"] = self.phase_state
            signals["west"] = self.phase_state
        return signals

    def tick(self, dt: float, traffic_data: Dict[str, Dict[str, Any]]):
        self.time_remaining -= dt

        # Emergency preemption check
        ns_emergency = traffic_data.get("north", {}).get("has_emergency") or traffic_data.get("south", {}).get("has_emergency")
        ew_emergency = traffic_data.get("east", {}).get("has_emergency") or traffic_data.get("west", {}).get("has_emergency")

        if ew_emergency and self.current_phase == "NORTH_SOUTH" and self.phase_state == "GREEN":
            self.phase_state = "YELLOW"
            self.time_remaining = float(self.yellow)
            return
        elif ns_emergency and self.current_phase == "EAST_WEST" and self.phase_state == "GREEN":
            self.phase_state = "YELLOW"
            self.time_remaining = float(self.yellow)
            return

        if self.time_remaining <= 0:
            self._transition(traffic_data)

    def _transition(self, traffic_data: Dict[str, Dict[str, Any]]):
        if self.phase_state == "GREEN":
            self.phase_state = "YELLOW"
            self.time_remaining = float(self.yellow)
        elif self.phase_state == "YELLOW":
            self.phase_state = "ALL_RED"
            self.time_remaining = float(self.all_red)
        elif self.phase_state == "ALL_RED":
            # Compute phase priorities
            ns_score = max(
                self.calculate_priority_score(
                    traffic_data.get("north", {}).get("vehicle_count", 0),
                    traffic_data.get("north", {}).get("queue_length", 0),
                    traffic_data.get("north", {}).get("average_waiting_time", 0.0),
                    traffic_data.get("north", {}).get("has_emergency", False),
                ),
                self.calculate_priority_score(
                    traffic_data.get("south", {}).get("vehicle_count", 0),
                    traffic_data.get("south", {}).get("queue_length", 0),
                    traffic_data.get("south", {}).get("average_waiting_time", 0.0),
                    traffic_data.get("south", {}).get("has_emergency", False),
                ),
            )

            ew_score = max(
                self.calculate_priority_score(
                    traffic_data.get("east", {}).get("vehicle_count", 0),
                    traffic_data.get("east", {}).get("queue_length", 0),
                    traffic_data.get("east", {}).get("average_waiting_time", 0.0),
                    traffic_data.get("east", {}).get("has_emergency", False),
                ),
                self.calculate_priority_score(
                    traffic_data.get("west", {}).get("vehicle_count", 0),
                    traffic_data.get("west", {}).get("queue_length", 0),
                    traffic_data.get("west", {}).get("average_waiting_time", 0.0),
                    traffic_data.get("west", {}).get("has_emergency", False),
                ),
            )

            # Switch phase with anti-starvation safeguard
            next_phase = "EAST_WEST" if self.current_phase == "NORTH_SOUTH" else "NORTH_SOUTH"
            if next_phase == "EAST_WEST" and self.consecutive_rounds["NORTH_SOUTH"] >= self.max_consecutive:
                next_phase = "EAST_WEST"
            elif next_phase == "NORTH_SOUTH" and self.consecutive_rounds["EAST_WEST"] >= self.max_consecutive:
                next_phase = "NORTH_SOUTH"

            self.current_phase = next_phase
            self.consecutive_rounds[next_phase] += 1
            other = "EAST_WEST" if next_phase == "NORTH_SOUTH" else "NORTH_SOUTH"
            self.consecutive_rounds[other] = 0

            target_score = ns_score if next_phase == "NORTH_SOUTH" else ew_score
            opposing_score = ew_score if next_phase == "NORTH_SOUTH" else ns_score

            total_score = max(0.1, target_score + opposing_score)
            ratio = target_score / total_score
            dynamic_green = int(self.min_green + ratio * (self.max_green - self.min_green))
            dynamic_green = max(self.min_green, min(self.max_green, dynamic_green))

            self.allocated_green = float(dynamic_green)
            self.time_remaining = float(dynamic_green)
            self.phase_state = "GREEN"
