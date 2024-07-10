export const formatTime = (date: Date) => {
  return date.toISOString().split("T")[1].split(".")[0];
};
