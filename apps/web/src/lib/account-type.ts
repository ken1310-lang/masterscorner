/** The server owns `accountType`; the console only formats it. */
export function accountTypeLabel(accountType: string) {
  return accountType === "master" ? "Master account" : "Account";
}
