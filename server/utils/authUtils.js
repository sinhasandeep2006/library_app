export const generateVerificationCode = () => {
  function generateRandomSixDigitNumber() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  const verificationCode = generateRandomSixDigitNumber();

  // Get current local time
  const currentTime = new Date();
  const futureTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15 minutes ahead

  console.log("Current UTC Time:", currentTime.toISOString());
  console.log("Generated Future UTC Time:", futureTime.toISOString());

  // Function to format date for MySQL
  const formatToMySQLDatetime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure two digits
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // Correct format
  };

  const verificationCodeExpire = formatToMySQLDatetime(futureTime);

  console.log("Generated Future Local Time (Correct Format):", verificationCodeExpire);

  return { verificationCode, verificationCodeExpire };
};
