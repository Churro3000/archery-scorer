// Camera and Scanning Manager
class CameraManager {
    constructor() {
        this.currentStream = null;
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('canvas');
        this.capturedImageData = null;
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

    captureFrame() {
        // INSTANT FREEZE - capture current frame immediately
        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        ctx.drawImage(this.video, 0, 0);

        // Freeze the video display
        this.video.style.display = 'none';
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.objectFit = 'cover';

        this.capturedImageData = this.canvas.toDataURL('image/png');
        console.log('📸 Frame captured and frozen');
    }

    async captureAndAnalyze() {
        // First, freeze the screen instantly
        this.captureFrame();

        document.getElementById('processing-status').style.display = 'flex';

        try {
            // Now process in background
            const enhancedImage = await this.enhanceDocument(this.capturedImageData);
            const scoreData = await this.analyzeScorecard(enhancedImage);
            return scoreData;
        } catch (error) {
            console.error('Analysis error:', error);
            throw error;
        } finally {
            document.getElementById('processing-status').style.display = 'none';
        }
    }

    async enhanceDocument(imageData) {
        // Document scanner enhancement - make it black/white, high contrast
        const img = new Image();
        img.src = imageData;
        
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
            // Grayscale
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // High contrast threshold (scanner effect)
            const threshold = 128;
            const enhanced = gray > threshold ? 255 : 0;
            
            data[i] = enhanced;     // R
            data[i + 1] = enhanced; // G
            data[i + 2] = enhanced; // B
        }
        
        ctx.putImageData(imageDataObj, 0, 0);
        
        console.log('🔍 Document enhanced (scanner mode)');
        return canvas.toDataURL('image/png');
    }

    showRestartButton() {
        document.getElementById('capture').style.display = 'none';
        document.getElementById('restart-scan').style.display = 'inline-block';
    }

    hideRestartButton() {
        document.getElementById('capture').style.display = 'inline-block';
        document.getElementById('restart-scan').style.display = 'none';
        
        // Unfreeze video
        this.video.style.display = 'block';
        this.canvas.style.display = 'none';
    }

    async analyzeScorecard(imageData) {
        try {
            // OCR for archer details with better config
            const result = await Tesseract.recognize(imageData, 'eng', {
                logger: m => console.log(m),
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '
            });

            const text = result.data.text;
            console.log('📝 OCR Result:', text);

            const scoreData = this.parseOCRText(text);
            
            // Real OMR detection (looking for filled circles/boxes)
            scoreData.scores = await this.detectFilledCircles(imageData);

            return scoreData;
        } catch (error) {
            console.error('OCR Error:', error);
            return { 
                name: '',
                category: '',
                gender: '',
                club: '',
                scores: this.createEmptyScores()
            };
        }
    }

    parseOCRText(text) {
        const data = {
            name: '',
            category: '',
            gender: '',
            club: ''
        };

        const lines = text.split('\n').map(l => l.trim());
        
        // Find NAME
        for (let line of lines) {
            if (line.toUpperCase().includes('NAME')) {
                const nameMatch = line.match(/NAME[\s:]*([A-Za-z\s]+)/i);
                if (nameMatch && nameMatch[1]) {
                    data.name = nameMatch[1].trim();
                }
            }
        }

        // Category detection
        const fullText = text.toUpperCase();
        if (fullText.includes('AAG')) data.category = 'AAG';
        else if (fullText.includes('SENIOR')) data.category = 'Seniors';
        else if (fullText.includes('JUNIOR')) data.category = 'Juniors';

        // Club detection
        if (fullText.includes('ACTIVE')) data.club = 'Active';
        else if (fullText.includes('HOGS')) data.club = 'Hogs';
        else if (fullText.includes('VALLEY')) data.club = 'Valley';

        // Gender - look for checked box near M or F
        if (fullText.match(/M[\s]*[✓✗xX\/]/)) data.gender = 'M';
        else if (fullText.match(/F[\s]*[✓✗xX\/]/)) data.gender = 'F';

        console.log('Parsed data:', data);
        return data;
    }

    async detectFilledCircles(imageData) {
        // This is a simplified OMR - looks for dark pixels in grid positions
        // In production, you'd use OpenCV for proper circle detection
        
        const img = new Image();
        img.src = imageData;
        
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simulate detection - in reality would analyze grid positions
        // For now, read numbers from grid boxes
        const scores = this.createEmptyScores();
        
        console.log('🎯 OMR Detection attempted (using simulation for now)');
        
        // TODO: Implement real circle/box detection with OpenCV.js
        // For now, return empty scores so user fills manually
        return scores;
    }

    createEmptyScores() {
        return {
            '10m-s1': [0, 0, 0, 0, 0],
            '10m-s2': [0, 0, 0, 0, 0],
            '10m-s3': [0, 0, 0, 0, 0],
            '15m-s1': [0, 0, 0, 0, 0],
            '15m-s2': [0, 0, 0, 0, 0],
            '15m-s3': [0, 0, 0, 0, 0]
        };
    }
}