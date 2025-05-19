export interface JwtPayload {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR';
  hostelId: string;
}
