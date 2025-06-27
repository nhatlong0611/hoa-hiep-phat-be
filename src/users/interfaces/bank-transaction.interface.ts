export interface BankTransaction {
  bankTransactionId: number; // Mã GD
  description: string; // Mô tả
  amount: number; // Giá trị
  transactionDate: string; // Ngày diễn ra
  accountNumber: string; // Số tài khoản
}

export interface BankTransactionResponse {
  data: BankTransaction[];
}
