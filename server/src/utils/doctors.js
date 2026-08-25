// One doctor fixed per city — no real staff directory exists for this
// assessment, so assignment is deterministic per the assignment's mock data.

const DOCTORS_BY_CITY = {
  Lahore: { name: 'Dr. Ayesha Malik', clinicName: 'Lahore Wellness Clinic', contact: '+92 300 1112233' },
  Islamabad: { name: 'Dr. Bilal Ahmed', clinicName: 'Islamabad Wellness Clinic', contact: '+92 300 2223344' },
  Rawalpindi: { name: 'Dr. Sara Khan', clinicName: 'Rawalpindi Wellness Clinic', contact: '+92 300 3334455' },
  Faisalabad: { name: 'Dr. Omar Sheikh', clinicName: 'Faisalabad Wellness Clinic', contact: '+92 300 4445566' },
};

const CITIES = Object.keys(DOCTORS_BY_CITY);

function getDoctorForCity(city) {
  return DOCTORS_BY_CITY[city] || DOCTORS_BY_CITY[CITIES[0]];
}

module.exports = { CITIES, getDoctorForCity };