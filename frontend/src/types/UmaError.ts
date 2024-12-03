export class UmaError extends Error {
  response: unknown;

  constructor(message: string, response: unknown) {
    super(message);
    this.name = "UmaError";
    this.response = response;
  }

  getFormattedResponse(): string {
    if (typeof this.response === "object") {
      return JSON.stringify(this.response, null, 2);
    } else if (typeof this.response === "string") {
      return this.response;
    } else {
      return "Unknown error response type";
    }
  }
}
