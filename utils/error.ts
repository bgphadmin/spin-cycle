import { ZodError } from "zod";

export const renderError = (error: unknown): { message: string } => {
  if (error instanceof ZodError) {
    return {
      message: JSON.stringify([
        { message: "Error: " + JSON.parse(error.message)[0].message || error.message },
        { result: "error" },
      ])
    };
  } else if (error instanceof Error) {
    return {
      message: JSON.stringify([
        { message: "Error: " + error.message },
        { result: "error" },
      ])
    };
  } else {
    return {
      message: JSON.stringify([
        { message: "Something went wrong." },
        { result: "error" },
      ])
    };
  }
};