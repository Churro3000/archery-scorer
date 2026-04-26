// Main App - Orchestrates Everything
class ArcheryScorerApp {
    constructor() {
        this.storage = new StorageManager();
        this.camera = new CameraManager();
        this.scoring = new ScoringManager();
        this.results = new ResultsManager(this.storage);
        this.exporter = new ExportManager(this.storage);
        this.database = new DatabaseManager();
        
        this.init();
    }

    async init() {
        await this.storage.init();
        this.scoring.createArrowInputs();
        this.scoring.addCalculationListeners();
        this.results.addFilterListeners();
        this.initEventListeners();
        await this.results.loadScores();
        
        console.log('🏹 Archery Scorer App Ready!');
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Camera
        document.getElementById('start-camera').addEventListener('click', () => this.camera.start());
        document.getElementById('stop-camera').addEventListener('click', () => this.camera.stop());
        document.getElementById('capture').addEventListener('click', () => this.handleCapture());

        // Manual entry
        document.getElementById('new-manual-entry').addEventListener('click', () => this.openScoreForm(null));

        // Form
        document.querySelector('.close-modal').addEventListener('click', () => this.closeScoreForm());
        document.querySelector('.cancel-form').addEventListener('click', () => this.closeScoreForm());
        document.getElementById('archer-form').addEventListener('submit', (e) => this.saveScore(e));

        // Export
        document.getElementById('generate-pdf').addEventListener('click', () => this.exporter.generatePDF());
        document.getElementById('export-csv').addEventListener('click', () => this.exporter.exportCSV());
        document.getElementById('sync-database').addEventListener('click', () => this.handleSync());
    }

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${viewName}-view`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        if (viewName === 'results') {
            this.results.display();
        }
    }

    async handleCapture() {
        try {
            const scoreData = await this.camera.captureAndAnalyze();
            this.openScoreForm(scoreData);
        } catch (error) {
            alert('Error analyzing scorecard: ' + error.message);
        }
    }

    openScoreForm(data) {
        const modal = document.getElementById('score-form');
        modal.style.display = 'flex';

        document.getElementById('archer-form').reset();
        this.scoring.resetForm();

        if (data) {
            if (data.name) document.getElementById('archer-name').value = data.name;
            if (data.category) document.getElementById('category').value = data.category;
            if (data.gender) document.getElementById('gender').value = data.gender;
            if (data.club) document.getElementById('club').value = data.club;

            if (data.scores) {
                this.scoring.populateScores(data.scores);
            }
        }
    }

    closeScoreForm() {
        document.getElementById('score-form').style.display = 'none';
    }

    async saveScore(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('archer-name').value,
            category: document.getElementById('category').value,
            gender: document.getElementById('gender').value,
            club: document.getElementById('club').value,
            timestamp: new Date().toISOString()
        };

        formData.scores = this.scoring.getScoreData();
        const totals = this.scoring.calculateTotals();
        formData.totals = totals;
        formData.finalScore = totals.roundTotal;

        await this.storage.saveScore(formData);

        this.closeScoreForm();
        alert(`✅ Score saved for ${formData.name}! Total: ${formData.finalScore}/300`);

        await this.results.loadScores();
    }

    async handleSync() {
        const scores = await this.storage.getAllScores();
        await this.database.syncScores(scores);
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ArcheryScorerApp();
});

// Service Worker for offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('✅ Service Worker registered'))
            .catch(err => console.log('❌ SW registration failed:', err));
    });
}