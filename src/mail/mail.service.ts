import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export type Lang = 'es' | 'en';
export type RoomSlug =
  | '10-mixed-shared-bed'
  | '6-mixed-shared-bed'
  | '4-mixed-shared-bed';

const roomTranslations: Record<Lang, Record<RoomSlug, string>> = {
  es: {
    '10-mixed-shared-bed': 'Cama en habitación compartida mixta de 10 personas',
    '6-mixed-shared-bed': 'Cama en habitación compartida mixta de 6 personas',
    '4-mixed-shared-bed': 'Cama en habitación compartida mixta de 4 personas',
  },
  en: {
    '10-mixed-shared-bed': 'Bed in 10-bed mixed shared room',
    '6-mixed-shared-bed': 'Bed in 6-bed mixed shared room',
    '4-mixed-shared-bed': 'Bed in 4-bed mixed shared room',
  },
};

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private formatDateByLang(dateStr: string, lang: Lang): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return lang === 'es'
      ? `${day}/${month}/${year}`
      : `${month}-${day}-${year}`;
  }

  private formatCurrency(amount: number, lang: Lang): string {
    return new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private calculateNights(from: string, to: string): number {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(Math.round(diffDays), 1);
  }

  async sendReservationConfirmation(options: {
    to: string;
    name: string;
    roomSlug: RoomSlug;
    from: string;
    toDate: string;
    guests: number;
    total: number;
    lang: Lang;
  }): Promise<void> {
    const lang = options.lang;

    const translatedRoomName =
      roomTranslations[lang]?.[options.roomSlug] ?? options.roomSlug;

    const roomNameES =
      roomTranslations.es[options.roomSlug] ?? options.roomSlug;

    const subjects = {
      es: 'Confirmación de reserva en Total Hostel',
      en: 'Reservation Confirmation at Total Hostel',
    };

    const greetings = {
      es: `¡Hola ${options.name}!`,
      en: `Hello ${options.name}!`,
    };

    const intro = {
      es: 'Tu reserva fue confirmada:',
      en: 'Your reservation has been confirmed:',
    };

    const fieldLabels = {
      es: {
        room: 'Habitación',
        from: 'Desde',
        to: 'Hasta',
        nights: 'Noches',
        guests: 'Huéspedes',
        total: 'Total',
        thanks: 'Gracias por elegir Total Hostel 🏨✨',
      },
      en: {
        room: 'Room',
        from: 'From',
        to: 'To',
        nights: 'Nights',
        guests: 'Guests',
        total: 'Total',
        thanks: 'Thank you for choosing Total Hostel 🏨✨',
      },
    };

    const formattedFrom = this.formatDateByLang(options.from, lang);
    const formattedTo = this.formatDateByLang(options.toDate, lang);
    const formattedTotal = this.formatCurrency(options.total, lang);
    const nights = this.calculateNights(options.from, options.toDate);

    const guestHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <img src="https://yourdomain.com/images/hostel-header.jpg" alt="Total Hostel" style="width: 100%; border-radius: 8px 8px 0 0;" />

        <h2 style="color: #333;">${greetings[lang]}</h2>
        <p style="font-size: 16px;">${intro[lang]}</p>

        <table style="width: 100%; font-size: 16px; margin-top: 16px;">
          <tr>
            <td><strong>${fieldLabels[lang].room}:</strong></td>
            <td>${translatedRoomName}</td>
          </tr>
          <tr>
            <td><strong>${fieldLabels[lang].from}:</strong></td>
            <td>${formattedFrom}</td>
          </tr>
          <tr>
            <td><strong>${fieldLabels[lang].to}:</strong></td>
            <td>${formattedTo}</td>
          </tr>
          <tr>
            <td><strong>${fieldLabels[lang].nights}:</strong></td>
            <td>${nights}</td>
          </tr>
          <tr>
            <td><strong>${fieldLabels[lang].guests}:</strong></td>
            <td>${options.guests}</td>
          </tr>
          <tr>
            <td><strong>${fieldLabels[lang].total}:</strong></td>
            <td>${formattedTotal}</td>
          </tr>
        </table>

        <p style="margin-top: 24px;">${fieldLabels[lang].thanks}</p>
      </div>
    `;

    const hostelHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <img src="https://yourdomain.com/images/hostel-header.jpg" alt="Total Hostel" style="width: 100%; border-radius: 8px 8px 0 0;" />

        <h2 style="color: #333;">¡Hola ${options.name}!</h2>
        <p style="font-size: 16px;">Tu reserva fue confirmada:</p>

        <table style="width: 100%; font-size: 16px; margin-top: 16px;">
          <tr>
            <td><strong>Habitación:</strong></td>
            <td>${roomNameES}</td>
          </tr>
          <tr>
            <td><strong>Desde:</strong></td>
            <td>${this.formatDateByLang(options.from, 'es')}</td>
          </tr>
          <tr>
            <td><strong>Hasta:</strong></td>
            <td>${this.formatDateByLang(options.toDate, 'es')}</td>
          </tr>
          <tr>
            <td><strong>Noches:</strong></td>
            <td>${nights}</td>
          </tr>
          <tr>
            <td><strong>Huéspedes:</strong></td>
            <td>${options.guests}</td>
          </tr>
          <tr>
            <td><strong>Total:</strong></td>
            <td>${this.formatCurrency(options.total, 'es')}</td>
          </tr>
        </table>

        <p style="margin-top: 24px;">Gracias por elegir Total Hostel 🏨✨</p>
      </div>
    `;

    await this.mailerService.sendMail({
      to: options.to,
      subject: subjects[lang],
      html: guestHtml,
    });

    await this.mailerService.sendMail({
      to: 'hosteltotalsalta@gmail.com',
      subject: `Copia de reserva confirmada - ${options.name}`,
      html: hostelHtml,
    });
  }
}
