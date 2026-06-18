import type { jsPDF } from 'jspdf';
import type { Ticket } from '../../types/ticket';
import { formatCurrency } from '../../lib/formatters';

type GenerateTicketPdfOptions = {
  ticket: Ticket | null;
  baseUrl?: string;
};

const page = {
  width: 210,
  margin: 16
};

function requireTicket(ticket: Ticket | null): asserts ticket is Ticket {
  if (!ticket) {
    throw new Error('Nenhum bilhete selecionado para gerar PDF.');
  }
}

function resolveTicketUrl(ticket: Ticket, baseUrl?: string) {
  const origin =
    baseUrl ??
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'http://localhost:5173');

  return `${origin}/ticket/${ticket.id}`;
}

function addLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(value, x, y + 5);
}

export async function generateTicketPdf({ ticket, baseUrl }: GenerateTicketPdfOptions) {
  requireTicket(ticket);

  const [{ default: jsPDF }, { default: QRCode }] = await Promise.all([
    import('jspdf'),
    import('qrcode')
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ticketUrl = resolveTicketUrl(ticket, baseUrl);
  const qrCode = await QRCode.toDataURL(ticketUrl, {
    margin: 1,
    width: 180,
    color: {
      dark: '#047857',
      light: '#ffffff'
    }
  });

  doc.setFillColor(4, 120, 87);
  doc.rect(0, 0, page.width, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RMTRAVEL', page.margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de reserva aerea', page.margin, 23);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(150, 7, 42, 42, 3, 3, 'F');
  doc.addImage(qrCode, 'PNG', 154, 11, 34, 34);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${ticket.passenger} ${ticket.surname}`, page.margin, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Localizador ${ticket.locator} | ${ticket.airline} | ${ticket.provider}`, page.margin, 58);

  addLabelValue(doc, 'Status', ticket.status, page.margin, 72);
  addLabelValue(doc, 'Valor', formatCurrency(ticket.amount), 66, 72);
  addLabelValue(doc, 'Bilhete', ticket.id, 118, 72);

  let y = 94;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Trechos', page.margin, y);
  y += 8;

  ticket.segments.forEach((segment, index) => {
    if (y > 245) {
      doc.addPage();
      y = 24;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(page.margin, y - 5, 178, 43, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.text(`Trecho ${index + 1} | Voo ${segment.flightNumber}`, page.margin + 4, y + 2);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(segment.origin.iata, page.margin + 4, y + 14);
    doc.text(segment.destination.iata, page.margin + 98, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${segment.origin.city}${segment.origin.terminal ? ` T${segment.origin.terminal}` : ''}`, page.margin + 4, y + 21);
    doc.text(`${segment.destination.city}${segment.destination.terminal ? ` T${segment.destination.terminal}` : ''}`, page.margin + 98, y + 21);
    doc.text(`${segment.departure.date} ${segment.departure.time}`, page.margin + 4, y + 28);
    doc.text(`${segment.arrival.date} ${segment.arrival.time}`, page.margin + 98, y + 28);
    doc.text(`Classe: ${segment.fareClass ?? 'Nao informada'}`, page.margin + 4, y + 35);
    doc.text(`Mao: ${segment.baggage.carryOn}`, page.margin + 98, y + 35);
    doc.text(`Despachada: ${segment.baggage.checked}`, page.margin + 98, y + 40);

    y += 50;
  });

  if (y > 235) {
    doc.addPage();
    y = 24;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Observacoes', page.margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(ticket.observations, 178), page.margin, y + 8);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`QR Code: ${ticketUrl}`, page.margin, 286);

  doc.save(`RMTRAVEL-${ticket.locator}-${ticket.surname}.pdf`);
}
