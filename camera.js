// Camera and Scanning Manager
class CameraManager {
    constructor() {
        this.currentStream = null;
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('canvas');
    }

    async start() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.currentStream;

            document.getElementById('start-camera').style.display = 'none';
            document.getElementById('capture').style.display = 'inline-block';
            document.getElementById('restart-scan').style.display = 'none';
            document.getElementById('stop-camera').style.display = 'inline-block';

            console.log('📷 Camera started');
        } catch (error) {
            alert('Camera access denied: ' + error.message);
            console.error('Camera error:', error);
        }
    }

    stop() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
            this.video.srcObject = null;
        }

        document.getElementById('start-camera').style.display = 'inline-block';
        document.getElementById('capture').style.display = 'none';
        document.getElementById('restart-scan').style.display = 'none';
        document.getElementById('stop-camera').style.display = 'none';

        console.log('🛑 Camera stopped');
    }

    async captureAndAnalyze() {
        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        ctx.drawImage(this.video, 0, 0);

        document.getElementById('processing-status').style.display = 'flex';

        try {
            const imageData = this.canvas.toDataURL('image/png');
            const scoreData = await this.analyzeScorecard(imageData);
            return scoreData;
        } catch (error) {
            console.error('Analysis error:', error);
            throw error;
        } finally {
            document.getElementById('processing-status').style.display = 'none';
        }
    }

    showRestartButton() {
        document.getElementById('capture').style.display = 'none';
        document.getElementById('restart-scan').style.display = 'inline-block';
    }

    hideRestartButton() {
        document.getElementById('capture').style.display = 'inline-block';
        document.getElementById('restart-scan').style.display = 'none';
    }

    async analyzeScorecard(imageData) {
        try {
            // OCR for archer details
            const result = await Tesseract.recognize(imageData, 'eng', {
                logger: m => console.log(m)
            });

            const text = result.data.text;
            console.log('📝 OCR Result:', text);

            const scoreData = this.parseOCRText(text);
            scoreData.scores = this.simulateOMR();

            return scoreData;
        } catch (error) {
            console.error('OCR Error:', error);
            return { scores: this.simulateOMR() };
        }
    }

    parseOCRText(text) {
        const data = {
            name: '',
            category: '',
            gender: '',
            club: ''
        };

        // Extract name - look for "NAME" label
        const nameMatch = text.match(/NAME[\s:]*([A-Za-z\s]+)/i);
        if (nameMatch) {
            data.name = nameMatch[1].trim();
        }

        // Category detection
        if (text.includes('AAG')) data.category = 'AAG';
        else if (text.includes('Senior')) data.category = 'Seniors';
        else if (text.includes('Junior')) data.category = 'Juniors';

        // Club detection
        if (text.includes('Active')) data.club = 'Active';
        else if (text.includes('Hogs')) data.club = 'Hogs';
        else if (text.includes('Valley')) data.club = 'Valley';

        // Gender detection - look for M or F checkbox
        if (text.includes('|M|') || text.match(/M\s*[✓✗xX]/)) data.gender = 'M';
        else if (text.includes('|F|') || text.match(/F\s*[✓✗xX]/)) data.gender = 'F';

        return data;
    }

    simulateOMR() {
        const scores = {};
        const sections = ['10m-s1', '10m-s2', '10m-s3', '15m-s1', '15m-s2', '15m-s3'];
        
        sections.forEach(section => {
            scores[section] = [];
            for (let i = 0; i < 5; i++) {
                scores[section].push(Math.floor(Math.random() * 6) + 5);
            }
        });

        return scores;
    }
}