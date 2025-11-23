// utils/haversine.js
/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Filter users by proximity to a given location
 * @param {Array} users - Array of user objects with address.lat and address.lng
 * @param {number} targetLat - Target latitude
 * @param {number} targetLng - Target longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @returns {Array} Array of users within the specified distance, sorted by proximity
 */
export function filterUsersByProximity(users, targetLat, targetLng, maxDistanceKm = 10) {
  return users
    .map(user => {
      // Skip users without valid coordinates
      if (!user.address || !user.address.lat || !user.address.lng) {
        return null;
      }
      
      const distance = calculateDistance(
        targetLat,
        targetLng,
        user.address.lat,
        user.address.lng
      );
      
      return {
        ...user,
        distanceKm: distance
      };
    })
    .filter(user => user !== null && user.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm); // Sort by closest first
}