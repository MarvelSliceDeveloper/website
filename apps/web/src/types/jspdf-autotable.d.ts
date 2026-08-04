declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
    GState: new (params: { opacity: number }) => unknown;
  }
}
