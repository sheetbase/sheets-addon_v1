export type ErrorAlert = (error: string | Error, title?: string) => any;

export interface Google {
  script: Script;
}

interface Script {
  run: Run;
}

interface Run {
  withFailureHandler?(
    callback: {
      (error: Error): any;
    },
  ): Run;
  withSuccessHandler?<Value>(
    callback: {
      (value: Value): any;
    },
  ): Run;
  // GAS functions
  [name: string]: (... args: any[]) => any;
}
