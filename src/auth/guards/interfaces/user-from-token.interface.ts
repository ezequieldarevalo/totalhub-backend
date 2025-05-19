export interface UserFromToken {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR';
  hostelId: string;
}
