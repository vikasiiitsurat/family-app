export const isTodayBirthday = (dob: string): boolean => {
  const today = new Date();
  const birthDate = new Date(dob);
  return (
    today.getMonth() === birthDate.getMonth() &&
    today.getDate() === birthDate.getDate()
  );
};

export const isTodayAnniversary = (anniversary: string | null | undefined): boolean => {
  if (!anniversary) return false;
  const today = new Date();
  const annivDate = new Date(anniversary);
  return (
    today.getMonth() === annivDate.getMonth() &&
    today.getDate() === annivDate.getDate()
  );
};

export const getDaysUntilBirthday = (dob: string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  const currentYear = today.getFullYear();

  let nextBirthday = new Date(
    currentYear,
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday = new Date(
      currentYear + 1,
      birthDate.getMonth(),
      birthDate.getDate()
    );
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getAge = (dob: string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};
