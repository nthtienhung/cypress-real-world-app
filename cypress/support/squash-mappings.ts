export const testCaseMappings: Record<string, number> = {
  "TC-1: gets a list of users": 316,
};

export const getTestCaseId = (testName: string): number | null => {
  return testCaseMappings[testName] || null;
};
