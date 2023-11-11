const fs = require('fs/promises')
const path = require("path");
const crypto =require("crypto");

const contactsPath = path.join(__dirname, "..", "models", "contacts.json");

const listContacts = async () => {
  const rawJSON = await fs.readFile(contactsPath, "utf-8");
  return JSON.parse(rawJSON);
};

const getContactById = async (contactId) => {
  const contacts = await listContacts();
  const contactByID = contacts.find((contact) => contact.id === contactId);  
  return contactByID || null;
};

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);

  if (index === -1) {
    return null;
  }
  const newContacts = [...contacts.slice(0, index), ...contacts.slice(index + 1)];

  await fs.writeFile(contactsPath, JSON.stringify(newContacts, null, 2));

  return contacts[index];  
};

const addContact = async (body) => {
  const contacts = await listContacts();
  const newContact = {id: crypto.randomUUID(), ...body};

  contacts.push(newContact);
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return newContact;
};

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) {
    return null;
  }
  contacts[index] = { id: contactId, ...body };
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return contacts[index];
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}
