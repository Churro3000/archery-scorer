// Score Calculation Manager - Scorecard Style
class ScoringManager {
    constructor() {
        this.sections = ['10m-r1', '10m-r2', '10m-r3', '15m-r1', '15m-r2', '15m-r3'];
        this.scores = {};
    }

    createArrowInputs() {
        // Create scorecard-style grids (like the actual paper scorecard)
        this.sections.forEach(sectionId => {
            const container = document.getElementById(sectionId);
            
            // Create 5 rows (5 arrows)
            for (let arrow = 0; arrow < 5; arrow++) {
                const row = document.createElement('div');
                row.className = 'score-row';
                
                // Create 11 circles (0-10)
                for (let score = 0; score <= 10; score++) {
                    const circle = document.createElement('div');
                    circle.className = 'score-circle';
                    circle.textContent = score;
                    circle.dataset.section = sectionId;
                    circle.dataset.arrow = arrow;
                    circle.dataset.score = score;
                    
                    circle.addEventListener('click', () => this.selectScore(circle));
                    
                    row.appendChild(circle);
                }
                
                container.appendChild(row);
            }
        });
        
        // Initialize empty scores
        this.resetScores();
    }

    selectScore(circle) {
        const section = circle.dataset.section;
        const arrow = parseInt(circle.dataset.arrow);
        const score = parseInt(circle.dataset.score);
        
        // Deselect all circles in this row
        const row = circle.parentElement;
        row.querySelectorAll('.score-circle').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select this circle
        circle.classList.add('selected');
        
        // Update scores
        if (!this.scores[section]) {
            this.scores[section] = [0, 0, 0, 0, 0];
        }
        this.scores[section][arrow] = score;
        
        // Recalculate totals
        this.calculateTotals();
    }

    calculateTotals() {
        // Calculate 10m total
        const total10m = (this.scores['10m-r1'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0) +
                        (this.scores['10m-r2'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0) +
                        (this.scores['10m-r3'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0);
        
        // Calculate 15m total
        const total15m = (this.scores['15m-r1'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0) +
                        (this.scores['15m-r2'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0) +
                        (this.scores['15m-r3'] || [0,0,0,0,0]).reduce((a,b) => a+b, 0);
        
        // Grand total
        const grandTotal = total10m + total15m;
        
        // Update displays
        document.getElementById('total-10m').textContent = total10m;
        document.getElementById('total-15m').textContent = total15m;
        document.getElementById('grand-total').textContent = grandTotal;
        
        return { total10m, total15m, grandTotal };
    }

    populateScores(detectedScores) {
        // Map detected scores to form
        const sectionMap = {
            '10m-s1': '10m-r1',
            '10m-s2': '10m-r2',
            '10m-s3': '10m-r3',
            '15m-s1': '15m-r1',
            '15m-s2': '15m-r2',
            '15m-s3': '15m-r3'
        };

        Object.keys(detectedScores).forEach(oldKey => {
            const newKey = sectionMap[oldKey];
            if (newKey && detectedScores[oldKey]) {
                this.scores[newKey] = detectedScores[oldKey];
                
                // Select the circles in UI
                detectedScores[oldKey].forEach((score, arrowIdx) => {
                    const circle = document.querySelector(
                        `[data-section="${newKey}"][data-arrow="${arrowIdx}"][data-score="${score}"]`
                    );
                    if (circle) {
                        circle.click();
                    }
                });
            }
        });
    }

    getScoreData() {
        return this.scores;
    }

    resetScores() {
        this.scores = {
            '10m-r1': [0, 0, 0, 0, 0],
            '10m-r2': [0, 0, 0, 0, 0],
            '10m-r3': [0, 0, 0, 0, 0],
            '15m-r1': [0, 0, 0, 0, 0],
            '15m-r2': [0, 0, 0, 0, 0],
            '15m-r3': [0, 0, 0, 0, 0]
        };
        
        // Deselect all circles
        document.querySelectorAll('.score-circle').forEach(c => {
            c.classList.remove('selected');
        });
        
        this.calculateTotals();
    }

    resetForm() {
        this.resetScores();
    }

    addCalculationListeners() {
        // Not needed - calculation happens on circle click
    }
}