// Score Calculation Manager
class ScoringManager {
    constructor() {
        this.sections = ['r1-10m-s1', 'r1-10m-s2', 'r1-10m-s3', 'r1-15m-s1', 'r1-15m-s2', 'r1-15m-s3'];
    }

    createArrowInputs() {
        this.sections.forEach(sectionId => {
            const container = document.getElementById(sectionId);
            for (let i = 0; i < 5; i++) {
                const select = document.createElement('select');
                select.className = 'arrow-input';
                select.dataset.section = sectionId;
                
                for (let score = 0; score <= 10; score++) {
                    const option = document.createElement('option');
                    option.value = score;
                    option.textContent = score;
                    select.appendChild(option);
                }
                
                container.appendChild(select);
            }
        });
    }

    addCalculationListeners() {
        document.querySelectorAll('.arrow-input').forEach(input => {
            input.addEventListener('change', () => this.calculateTotals());
        });
    }

    calculateTotals() {
        const sectionTotals = {};

        this.sections.forEach(sectionId => {
            const inputs = document.querySelectorAll(`#${sectionId} .arrow-input`);
            let total = 0;
            inputs.forEach(input => {
                total += parseInt(input.value) || 0;
            });
            sectionTotals[sectionId] = total;
            
            const sectionGroup = document.getElementById(sectionId).closest('.section-group');
            const totalDisplay = sectionGroup.querySelector('.section-total span');
            totalDisplay.textContent = total;
        });

        const dist10m = sectionTotals['r1-10m-s1'] + sectionTotals['r1-10m-s2'] + sectionTotals['r1-10m-s3'];
        const dist15m = sectionTotals['r1-15m-s1'] + sectionTotals['r1-15m-s2'] + sectionTotals['r1-15m-s3'];

        const distanceTotals = document.querySelectorAll('.distance-total span');
        distanceTotals[0].textContent = dist10m;
        distanceTotals[1].textContent = dist15m;

        const roundTotal = dist10m + dist15m;
        document.getElementById('r1-total').textContent = roundTotal;

        return { sections: sectionTotals, dist10m, dist15m, roundTotal };
    }

    populateScores(scores) {
        const sectionMap = {
            '10m-s1': 'r1-10m-s1',
            '10m-s2': 'r1-10m-s2',
            '10m-s3': 'r1-10m-s3',
            '15m-s1': 'r1-15m-s1',
            '15m-s2': 'r1-15m-s2',
            '15m-s3': 'r1-15m-s3'
        };

        Object.keys(scores).forEach(sectionKey => {
            const sectionId = sectionMap[sectionKey];
            if (sectionId) {
                const inputs = document.querySelectorAll(`#${sectionId} .arrow-input`);
                scores[sectionKey].forEach((score, index) => {
                    if (inputs[index]) {
                        inputs[index].value = score;
                    }
                });
            }
        });

        this.calculateTotals();
    }

    getScoreData() {
        const scores = {};
        this.sections.forEach(sectionId => {
            const inputs = document.querySelectorAll(`#${sectionId} .arrow-input`);
            scores[sectionId] = Array.from(inputs).map(input => parseInt(input.value));
        });
        return scores;
    }

    resetForm() {
        document.querySelectorAll('.arrow-input').forEach(input => {
            input.value = 0;
        });
        this.calculateTotals();
    }
}