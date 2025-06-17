const extractCategoryCode = (categoryString) => {
  const match = categoryString.match(/- (\w{2,3})$/); // Matches " - AU", " - COM", etc.
  return match ? match[1].toUpperCase() : 'XX';
};
export default extractCategoryCode;
