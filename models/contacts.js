const fs = require("fs/promises");
const { nanoid } = require("nanoid");
const path = require("path");

const contactsPath = path.join(__dirname, "contacts.json");

async function listContacts() {
  const data = await fs.readFile(contactsPath, "utf-8");
  return JSON.parse(data);
}

async function getContactById(contactId) {
  const contacts = await listContacts();
  const contact = contacts.find((contact) => contact.id === contactId);
  return contact || null;
}

async function addContact(body) {
  const contacts = await listContacts();
  const newContact = {
    id: nanoid(),
    ...body,
  };
  contacts.push(newContact);

  await fs.writeFile(contactsPath, JSON.stringify(contacts));
  return newContact;
}

async function removeContact(contactId) {
  const contacts = await listContacts();
  const idx = contacts.findIndex((contact) => contact.id === contactId);

  const [removedContact] = contacts.splice(idx, 1);
  await fs.writeFile(contactsPath, JSON.stringify(contacts));
  return console.log("Successfully deleted") || null;
}

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const { name, email, phone } = body;
  const idx = contacts.findIndex((contact) => contact.id === contactId);

  if (name || email || phone) {
    const updatedContact = {
      id: contactId,
      name: name ? name : contacts[idx].name,
      email: email ? email : contacts[idx].email,
      phone: phone ? phone : contacts[idx].phone,
    };

    contacts[idx] = updatedContact;
    await fs.writeFile(contactsPath, JSON.stringify(contacts), "utf-8");
    return updatedContact;
  }
  return null;
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};