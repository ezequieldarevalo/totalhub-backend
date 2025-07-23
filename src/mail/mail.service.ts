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
    isResident: boolean;
    paymentMethod: 'cash' | 'card';
    hasMuchiCard: boolean;
    muchiCardType?: 'cash' | 'debit' | 'credit';
    baseTotal?: number; // sin IVA o descuento
  }): Promise<void> {
    const {
      lang,
      name,
      roomSlug,
      from,
      toDate,
      guests,
      total,
      to,
      isResident,
      paymentMethod,
      hasMuchiCard,
      muchiCardType,
      baseTotal,
    } = options;

    const formattedFrom = this.formatDateByLang(from, lang);
    const formattedTo = this.formatDateByLang(toDate, lang);
    const formattedTotal = this.formatCurrency(total, lang);
    const formattedBaseTotal = baseTotal
      ? this.formatCurrency(baseTotal, lang)
      : null;
    const nights = this.calculateNights(from, toDate);

    const roomName = roomTranslations[lang]?.[roomSlug] ?? roomSlug;
    const roomNameES = roomTranslations.es[roomSlug] ?? roomSlug;

    const subject = {
      es: 'Confirmación de reserva en Total Hostel',
      en: 'Reservation Confirmation at Total Hostel',
    }[lang];

    const paymentLabel = isResident
      ? {
          es:
            paymentMethod === 'cash'
              ? 'Residente - Efectivo'
              : 'Residente - Tarjeta/Transferencia',
          en:
            paymentMethod === 'cash'
              ? 'Resident - Cash'
              : 'Resident - Card/Transfer',
        }[lang]
      : {
          es: 'Extranjero',
          en: 'Foreigner',
        }[lang];

    const discountNote =
      isResident && paymentMethod === 'cash'
        ? {
            es: 'Descuento por pagar en efectivo',
            en: 'Cash payment discount',
          }[lang]
        : !isResident && hasMuchiCard
          ? {
              es:
                muchiCardType === 'cash'
                  ? 'Descuento 15 % MuchiCard (efectivo)'
                  : muchiCardType === 'debit'
                    ? 'Descuento 10 % MuchiCard (débito)'
                    : muchiCardType === 'credit'
                      ? 'Descuento 5 % MuchiCard (crédito)'
                      : null,
              en:
                muchiCardType === 'cash'
                  ? '15% MuchiCard discount (cash)'
                  : muchiCardType === 'debit'
                    ? '10% MuchiCard discount (debit)'
                    : muchiCardType === 'credit'
                      ? '5% MuchiCard discount (credit)'
                      : null,
            }[lang]
          : null;

    const shouldShowBaseTotal = !!discountNote && baseTotal !== undefined;

    // Enviar mail al huésped
    await this.mailerService.sendMail({
      to,
      subject,
      template: `reservations/confirmation.${lang}.hbs`,
      context: {
        name,
        room: roomName,
        from: formattedFrom,
        to: formattedTo,
        nights,
        guests,
        total: formattedTotal,
        baseTotal: shouldShowBaseTotal ? formattedBaseTotal : null,
        discountNote,
        paymentLabel,
      },
    });

    const shouldShowBaseTotalES = !!discountNote && baseTotal !== undefined;

    // Enviar copia interna al hostel (siempre en español)
    await this.mailerService.sendMail({
      to: 'hosteltotalsalta@gmail.com',
      subject: `Copia de reserva confirmada - ${name}`,
      template: `reservations/confirmation.es.hbs`,
      context: {
        name,
        room: roomNameES,
        from: this.formatDateByLang(from, 'es'),
        to: this.formatDateByLang(toDate, 'es'),
        nights,
        guests,
        total: this.formatCurrency(total, 'es'),
        baseTotal: shouldShowBaseTotalES
          ? this.formatCurrency(baseTotal, 'es')
          : null,
        discountNote,
        paymentLabel,
      },
    });
  }
}
