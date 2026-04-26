// Export Manager (PDF, CSV)
class ExportManager {
    constructor(storageManager) {
        this.storage = storageManager;
    }

    async generatePDF() {
        const scores = await this.storage.getAllScores();
        
        if (scores.length === 0) {
            alert('No scores to export!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Archery Tournament Results', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Total Archers: ${scores.length}`, 20, 37);

        let y = 50;
        const categories = ['AAG', 'Seniors', 'Juniors'];
        const genders = ['M', 'F'];

        categories.forEach(category => {
            genders.forEach(gender => {
                const categoryScores = scores
                    .filter(s => s.category === category && s.gender === gender)
                    .sort((a, b) => b.finalScore - a.finalScore);

                if (categoryScores.length > 0) {
                    const genderLabel = gender === 'M' ? 'Male' : 'Female';
                    
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${category} - ${genderLabel}`, 20, y);
                    y += 10;

                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    
                    categoryScores.forEach((score, index) => {
                        const rank = index + 1;
                        const line = `${rank}. ${score.name} (${score.club}) - ${score.finalScore}/300`;
                        doc.text(line, 25, y);
                        y += 7;

                        if (y > 270) {
                            doc.addPage();
                            y = 20;
                        }
                    });

                    y += 5;
                }
            });
        });

        doc.save('archery-results.pdf');
        console.log('📄 PDF generated');
    }

    async exportCSV() {
        const scores = await this.storage.getAllScores();
        
        if (scores.length === 0) {
            alert('No scores to export!');
            return;
        }

        let csv = 'Rank,Name,Category,Gender,Club,Score\n';

        const sorted = [...scores].sort((a, b) => b.finalScore - a.finalScore);
        
        sorted.forEach((score, index) => {
            csv += `${index + 1},"${score.name}","${score.category}","${score.gender}","${score.club}",${score.finalScore}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archery-results.csv';
        a.click();
        
        console.log('📊 CSV exported');
    }
}