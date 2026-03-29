// pdf.js

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const payments = getPayments();
    const settings = getSettings();
    const selectedMonth = reportMonth.value;

    // Filter payments by selected month
    const filteredPayments = selectedMonth
        ? payments.filter(payment => payment.paymentMonth === selectedMonth)
        : payments;

    // Calculate totals
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const paidMembers = filteredPayments.length;
    const pendingMembers = 50 - paidMembers; // Example total members, adjust as needed

    // Add logo and title
    doc.setFontSize(18);
    doc.text('Helping Hands Circle', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Monthly Report', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Treasurer: ${settings.treasurerName}`, 105, 40, { align: 'center' });
    doc.text(`Month: ${selectedMonth || 'All'}`, 105, 50, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 60, { align: 'center' });

    // Add summary
    doc.text(`Total Paid: $${totalPaid.toFixed(2)}`, 20, 80);
    doc.text(`Paid Members: ${paidMembers}`, 20, 90);
    doc.text(`Pending Members: ${pendingMembers}`, 20, 100);

    // Add payments table
    const tableColumn = ["Name", "Amount", "Date", "Status"];
    const tableRows = filteredPayments.map(payment => [
        payment.memberName,
        `$${payment.amountPaid.toFixed(2)}`,
        payment.paymentDate,
        payment.status
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 185, 129] }
    });

    // Save the PDF
    doc.save(`Helping_Hands_Circle_Report_${selectedMonth || 'All'}.pdf`);
    showToast('PDF exported successfully!');
}