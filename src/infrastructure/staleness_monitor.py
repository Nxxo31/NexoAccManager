"""
Staleness Monitor for Cross-Profile Pipeline

Implements enhanced staleness monitoring per Recommendation 3 of the architectural analysis:
- Per-note staleness scoring (not just global threshold)
- 10% threshold for critical research findings (lowered from 15%)
- Automatic re-research trigger when confidence drops below CONFIRMED
- Confidence decay tracking across profile handoffs

The module works with research findings JSON format and provides:
- Staleness calculation per note based on age and confidence decay
- Threshold enforcement with automatic alerts
- Confidence persistence across profile transitions
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple


# Configuration constants
STALENESS_THRESHOLD_CRITICAL = 0.10  # 10% threshold (lowered from 15%)
STALENESS_THRESHOLD_WARNING = 0.15   # 15% threshold (legacy support)
CONFIDENCE_LEVELS = ["unverified", "probable", "confirmed"]
DEFAULT_DECAY_RATE = 0.05  # Per-handoff confidence decay rate
MAX_STALE_AGE_DAYS = 30  # Maximum age before forced re-research


class StalenessScore:
    """Represents the staleness score for a single research note."""
    
    def __init__(
        self,
        note_id: str,
        age_days: float,
        initial_confidence: str = "confirmed",
        last_handoff: Optional[datetime] = None,
        decay_rate: float = DEFAULT_DECAY_RATE,
    ):
        self.note_id = note_id
        self.age_days = age_days
        self.initial_confidence = initial_confidence
        self.last_handoff = last_handoff or datetime.now()
        self.decay_rate = decay_rate
        
    @property
    def confidence(self) -> str:
        """Get the effective confidence level after decay."""
        decay_factor = self._compute_decay_factor()
        effective_score = self._confidence_score() * (1 - decay_factor)
        
        if effective_score >= 0.8:
            return "confirmed"
        elif effective_score >= 0.5:
            return "probable"
        else:
            return "unverified"
    
    @property
    def staleness_percentage(self) -> float:
        """Calculate staleness as a percentage (0-100)."""
        decay_factor = self._compute_decay_factor()
        age_component = min(self.age_days / MAX_STALE_AGE_DAYS, 1.0) * 0.6 * 100
        decay_component = decay_factor * 0.4 * 100
        return age_component + decay_component
    
    @property
    def is_stale(self) -> bool:
        """Check if note exceeds the critical staleness threshold."""
        return self.staleness_percentage >= STALENESS_THRESHOLD_CRITICAL * 100
    
    @property
    def requires_re_research(self) -> bool:
        """Check if note triggers automatic re-research."""
        return self.staleness_percentage >= (STALENESS_THRESHOLD_CRITICAL + 0.05) * 100
    
    def _compute_decay_factor(self) -> float:
        """Compute confidence decay factor based on handoff history."""
        if self.last_handoff is None:
            return 0.0
        
        hours_since_handoff = (datetime.now() - self.last_handoff).total_seconds() / 3600
        return min(hours_since_handoff * self.decay_rate, 1.0)
    
    def _confidence_score(self) -> float:
        """Convert confidence level to numeric score."""
        if self.initial_confidence == "confirmed":
            return 1.0
        elif self.initial_confidence == "probable":
            return 0.7
        elif self.initial_confidence == "unverified":
            return 0.3
        return 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "note_id": self.note_id,
            "age_days": self.age_days,
            "initial_confidence": self.initial_confidence,
            "last_handoff": self.last_handoff.isoformat() if self.last_handoff else None,
            "decay_rate": self.decay_rate,
            "staleness_percentage": self.staleness_percentage,
            "is_stale": self.is_stale,
            "requires_re_research": self.requires_re_research,
            "effective_confidence": self.confidence,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StalenessScore":
        """Create from dictionary deserialization."""
        last_handoff = None
        if data.get("last_handoff"):
            last_handoff = datetime.fromisoformat(data["last_handoff"])
        return cls(
            note_id=data["note_id"],
            age_days=data["age_days"],
            initial_confidence=data.get("initial_confidence", "confirmed"),
            last_handoff=last_handoff,
            decay_rate=data.get("decay_rate", DEFAULT_DECAY_RATE),
        )


class StalenessMonitor:
    """Monitor staleness for research findings across profile handoffs."""
    
    def __init__(
        self,
        threshold_critical: float = STALENESS_THRESHOLD_CRITICAL,
        threshold_warning: float = STALENESS_THRESHOLD_WARNING,
        decay_rate: float = DEFAULT_DECAY_RATE,
    ):
        self.threshold_critical = threshold_critical
        self.threshold_warning = threshold_warning
        self.decay_rate = decay_rate
        self.scores: Dict[str, StalenessScore] = {}
    
    def update_note(
        self,
        note_id: str,
        age_days: float,
        initial_confidence: str = "confirmed",
        last_handoff: Optional[datetime] = None,
    ) -> StalenessScore:
        """Update or create a staleness score for a note."""
        score = StalenessScore(
            note_id=note_id,
            age_days=age_days,
            initial_confidence=initial_confidence,
            last_handoff=last_handoff,
            decay_rate=self.decay_rate,
        )
        self.scores[note_id] = score
        return score
    
    def get_score(self, note_id: str) -> Optional[StalenessScore]:
        """Get the staleness score for a specific note."""
        return self.scores.get(note_id)
    
    def analyze_all(self, findings: List[Dict[str, Any]]) -> Dict[str, any]:
        """Analyze staleness for all research findings.
        
        Returns a summary with:
        - total_notes: total count
        - stale_count: notes exceeding critical threshold
        - warning_count: notes near threshold
        - needs_re_research: notes requiring re-research
        - per_note_details: staleness scores for each note
        """
        results = {
            "total_notes": len(findings),
            "stale_count": 0,
            "warning_count": 0,
            "needs_re_research": 0,
            "per_note_details": [],
            "summary": {
                "critical_issues": [],
                "warning_issues": [],
                "re_research_needed": [],
            },
        }
        
        for finding in findings:
            note_id = finding.get("id", finding.get("claim", "unknown"))
            confidence = finding.get("confidence", "confirmed")
            timestamp = finding.get("timestamp")
            
            # Calculate age in days
            age_days = 0.0
            if timestamp:
                try:
                    if isinstance(timestamp, (int, float)):
                        age_days = (datetime.now().timestamp() - timestamp) / 86400
                    elif isinstance(timestamp, str):
                        ts = datetime.fromisoformat(timestamp)
                        age_days = (datetime.now() - ts).total_seconds() / 86400
                except (ValueError, TypeError):
                    age_days = 0.0
            
            # Last handoff time (use finding's own timestamp as proxy)
            last_handoff = None
            if "last_handoff" in finding:
                last_handoff = (
                    datetime.fromisoformat(finding["last_handoff"])
                    if isinstance(finding["last_handoff"], str)
                    else finding.get("last_handoff")
                )
            
            score = self.update_note(
                note_id=note_id,
                age_days=age_days,
                initial_confidence=confidence,
                last_handoff=last_handoff,
            )
            
            detail = score.to_dict()
            results["per_note_details"].append(detail)
            
            if score.is_stale:
                results["stale_count"] += 1
                results["summary"]["critical_issues"].append({
                    "note_id": note_id,
                    "staleness_percentage": score.staleness_percentage,
                    "effective_confidence": score.confidence,
                    "age_days": age_days,
                })
            
            if score.staleness_percentage >= self.threshold_warning * 100:
                results["warning_count"] += 1
                results["summary"]["warning_issues"].append({
                    "note_id": note_id,
                    "staleness_percentage": score.staleness_percentage,
                    "effective_confidence": score.confidence,
                })
            
            if score.requires_re_research:
                results["needs_re_research"] += 1
                results["summary"]["re_research_needed"].append({
                    "note_id": note_id,
                    "staleness_percentage": score.staleness_percentage,
                    "effective_confidence": score.confidence,
                })
        
        return results
    
    def generate_alerts(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate alerts for stale or decaying notes.
        
        Returns a list of alert dictionaries with:
        - type: 'critical', 'warning', 're_research', 'confidence_decay'
        - note_id: identifier of the affected note
        - message: human-readable description
        - recommended_action: suggested next step
        """
        alerts = []
        
        analysis = self.analyze_all(findings)
        
        for detail in analysis["per_note_details"]:
            note_id = detail["note_id"]
            
            # Critical staleness alert
            if detail["is_stale"]:
                alerts.append({
                    "type": "critical",
                    "note_id": note_id,
                    "message": f"Note '{note_id}' is {detail['staleness_percentage']:.1f}% stale (threshold: {STALENESS_THRESHOLD_CRITICAL*100:.0f}%)",
                    "recommended_action": "Trigger re-research and update confidence metrics",
                })
            
            # Warning alert
            if detail["staleness_percentage"] >= self.threshold_warning * 100:
                alerts.append({
                    "type": "warning",
                    "note_id": note_id,
                    "message": f"Note '{note_id}' at {detail['staleness_percentage']:.1f}% staleness (approaching {self.threshold_warning*100:.0f}% threshold)",
                    "recommended_action": "Review and validate before pipeline use",
                })
            
            # Re-research trigger
            if detail["requires_re_research"]:
                alerts.append({
                    "type": "re_research",
                    "note_id": note_id,
                    "message": f"Note '{note_id}' requires automatic re-research (staleness: {detail['staleness_percentage']:.1f}%)",
                    "recommended_action": "Initiate fresh research and update confidence",
                })
            
            # Confidence decay alert
            if detail["effective_confidence"] == "unverified" and detail["staleness_percentage"] > 0:
                alerts.append({
                    "type": "confidence_decay",
                    "note_id": note_id,
                    "message": f"Confidence decay detected for '{note_id}': {detail['effective_confidence']} (staleness: {detail['staleness_percentage']:.1f}%)",
                    "recommended_action": "Re-validate source and restore confidence if possible",
                })
        
        return alerts
    
    def get_pipeline_health_report(self, findings: List[Dict[str, Any]]) -> Dict[str, any]:
        """Generate a comprehensive pipeline health report.
        
        Returns metrics for monitoring cross-profile pipeline integrity.
        """
        analysis = self.analyze_all(findings)
        alerts = self.generate_alerts(findings)
        
        # Calculate overall health metrics
        critical_ratio = analysis["stale_count"] / max(1, analysis["total_notes"])
        warning_ratio = analysis["warning_count"] / max(1, analysis["total_notes"])
        re_research_ratio = analysis["needs_re_research"] / max(1, analysis["total_notes"])
        
        # Effective confidence across all notes
        effective_confidences = [
            d["effective_confidence"] for d in analysis["per_note_details"]
        ]
        confirmed_ratio = effective_confidences.count("confirmed") / max(1, len(effective_confidences))
        
        return {
            "pipeline_health": {
                "total_notes": analysis["total_notes"],
                "critical_ratio": round(critical_ratio, 3),
                "warning_ratio": round(warning_ratio, 3),
                "re_research_ratio": round(re_research_ratio, 3),
                "confirmed_ratio": round(confirmed_ratio, 3),
                "health_score": round(
                    1.0 - (critical_ratio * 1.5 + warning_ratio * 0.5), 3
                ),
            },
            "staleness_summary": {
                "threshold_critical": self.threshold_critical * 100,
                "threshold_warning": self.threshold_warning * 100,
                "decay_rate_per_handoff": self.decay_rate,
                "max_stale_age_days": MAX_STALE_AGE_DAYS,
            },
            "alerts": [
                {
                    "type": a["type"],
                    "note_id": a["note_id"],
                    "message": a["message"],
                    "action": a["recommended_action"],
                }
                for a in alerts
            ],
            "recommendations": self._generate_recommendations(analysis),
        }
    
    def _generate_recommendations(self, analysis: Dict[str, any]) -> List[str]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        # Calculate effective confidence ratio
        effective_confidences = [
            d["effective_confidence"] for d in analysis["per_note_details"]
        ]
        confirmed_ratio = effective_confidences.count("confirmed") / max(1, len(effective_confidences))
        
        if analysis["stale_count"] > 0:
            recommendations.append(
                f"Lower staleness threshold from 15% to 10% for {analysis['stale_count']} critical notes"
            )
        
        if analysis["needs_re_research"] > 0:
            recommendations.append(
                f"Trigger automatic re-research for {analysis['needs_re_research']} notes with decaying confidence"
            )
        
        if analysis["warning_count"] > analysis["total_notes"] * 0.3:
            recommendations.append(
                "Consider per-note scoring instead of global threshold for better precision"
            )
        
        if analysis["total_notes"] > 0 and confirmed_ratio < 0.7:
            recommendations.append(
                "Implement confidence persistence layer across profile handoffs"
            )
        
        return recommendations


# CLI utility function for quick staleness checking
def check_findings_staleness(
    findings: List[Dict[str, Any]],
    threshold: float = 0.10,
) -> Dict[str, any]:
    """Quick staleness check for a list of findings.
    
    Args:
        findings: List of research finding dictionaries with 'id', 'confidence', 'timestamp' keys
        threshold: Staleness threshold (default: 0.10 = 10%)
    
    Returns:
        Dictionary with staleness analysis results
    """
    monitor = StalenessMonitor(threshold_critical=threshold)
    return monitor.get_pipeline_health_report(findings)


if __name__ == "__main__":
    # Example usage
    sample_findings = [
        {
            "id": "finding_001",
            "claim": "Hermes Agent includes real-time conversational voice",
            "confidence": "confirmed",
            "timestamp": 1739900000,  # Recent
        },
        {
            "id": "finding_002",
            "claim": "A2A v1.0 protocol implementation details",
            "confidence": "confirmed",
            "timestamp": 1735000000,  # Older (~120 days)
        },
        {
            "id": "finding_003",
            "claim": "Grounded citations with fact-checking",
            "confidence": "probable",
            "timestamp": 1738000000,  # Medium age
        },
    ]
    
    report = check_findings_staleness(sample_findings)
    print("=== Staleness Monitor Report ===")
    print(f"Total notes: {report['pipeline_health']['total_notes']}")
    print(f"Critical staleness ratio: {report['pipeline_health']['critical_ratio']*100:.1f}%")
    print(f"Warning ratio: {report['pipeline_health']['warning_ratio']*100:.1f}%")
    print(f"Re-research ratio: {report['pipeline_health']['re_research_ratio']*100:.1f}%")
    print(f"Confirmed ratio: {report['pipeline_health']['confirmed_ratio']*100:.1f}%")
    print(f"Health score: {report['pipeline_health']['health_score']*100:.1f}%")
    print()
    print("Per-note details:")
    for detail in report["per_note_details"]:
        print(f"  - {detail['note_id']}: {detail['staleness_percentage']:.1f}% stale, "
              f"confidence: {detail['effective_confidence']}")
    print()
    print("Recommendations:")
    for rec in report["recommendations"]:
        print(f"  - {rec}")