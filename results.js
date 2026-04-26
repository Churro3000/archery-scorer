// Results Display Manager
class ResultsManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.scores = [];
    }

    async loadScores() {
        this.scores = await this.storage.getAllScores();
        this.display();
    }

    display() {
        const container = document.getElementById('results-display');
        
        if (this.scores.length === 0) {
            container.innerHTML = '<p class="no-results">No scores recorded yet. Start scanning or entering scores!</p>';
            return;
        }

        const categoryFilter = document.getElementById('filter-category').value;
        const genderFilter = document.getElementById('filter-gender').value;
        const clubFilter = document.getElementById('filter-club').value;

        let filtered = this.scores.filter(score => {
            if (categoryFilter !== 'all' && score.category !== categoryFilter) return false;
            if (genderFilter !== 'all' && score.gender !== genderFilter) return false;
            if (clubFilter !== 'all' && score.club !== clubFilter) return false;
            return true;
        });

        filtered.sort((a, b) => b.finalScore - a.finalScore);

        const categories = ['AAG', 'Seniors', 'Juniors'];
        const genders = ['M', 'F'];

        let html = '<div class="results-sections">';

        categories.forEach(category => {
            genders.forEach(gender => {
                const categoryScores = filtered.filter(s => s.category === category && s.gender === gender);
                
                if (categoryScores.length > 0) {
                    const genderLabel = gender === 'M' ? 'Male' : 'Female';
                    html += `
                        <div class="results-category">
                            <h3>${category} - ${genderLabel}</h3>
                            ${this.renderTable(categoryScores)}
                        </div>
                    `;
                }
            });
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderTable(scores) {
        let html = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Club</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
        `;

        scores.forEach((score, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            html += `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td>${score.name}</td>
                    <td>${score.club}</td>
                    <td><strong>${score.finalScore}/300</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    addFilterListeners() {
        document.getElementById('filter-category').addEventListener('change', () => this.display());
        document.getElementById('filter-gender').addEventListener('change', () => this.display());
        document.getElementById('filter-club').addEventListener('change', () => this.display());
    }
}