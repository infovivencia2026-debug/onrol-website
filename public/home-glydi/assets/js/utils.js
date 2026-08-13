/**
 * Generates a WhatsApp message URL for a lead application.
 * @param {object} leadData - The lead's information.
 * @param {string} leadData.name - The full name of the lead.
 * @param {string} leadData.email - The email address of the lead.
 * @param {string} leadData.phone - The phone number of the lead.
 * @param {string} [whatsAppNumber='918121306701'] - The target WhatsApp number.
 * @returns {string|null} The generated WhatsApp URL, or null if required data is missing.
 */
function generateWhatsAppLink(leadData, whatsAppNumber = '918121306701') {
  if (!leadData || !leadData.name || !leadData.email || !leadData.phone) return null;
  const text = `Hi ONROL, I’d like to apply for the next cohort.\n\nName: ${leadData.name}\nEmail: ${leadData.email}\nPhone: ${leadData.phone}`;
  return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(text)}`;
}