import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendReservationConfirmation(options: {
    to: string;
    name: string;
    room: string;
    from: string;
    toDate: string;
    guests: number;
    total: number;
  }): Promise<void> {
    await this.mailerService.sendMail({
      to: options.to,
      subject: 'Confirmación de reserva en Total Hostel',
      html: `
      <h2>¡Hola ${options.name}!</h2>
      <p>Tu reserva fue confirmada:</p>
      <ul>
        <li>Habitación: ${options.room}</li>
        <li>Desde: ${options.from}</li>
        <li>Hasta: ${options.toDate}</li>
        <li>Huéspedes: ${options.guests}</li>
        <li>Total: $${options.total}</li>
      </ul>
      <p>Gracias por elegir Total Hostel 🏨✨</p>
    `,
    });
  }
}
