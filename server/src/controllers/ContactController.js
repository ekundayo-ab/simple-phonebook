import { Contact, Group } from '../models';
import { validateContact, validateId } from '../helpers/validator';

export const addContact = (req, res) => {
  const { isValid, errors, sanitizeContact } = validateContact(req.body);
  if (!isValid) {
    return res.status(400).send({ message: 'Invalid inputs', errors });
  }

  return Contact.create({ ...sanitizeContact })
    .then((contact) => {
      const groupId = parseInt(contact.groupId, 10) || null;
      return Group.findById(groupId)
        .then((group) => {
          return res.status(201).send({ message: 'Contact created!', contact, group });
        });
    }).catch((error) => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).send({ message: 'Phone Number already used!' });
      }
      return res.status(500).send({
        message: 'Internal Server Error',
        error
      });
    });
};

export const updateContact = (req, res) => {
  const { contactId } = req.params;
  if (!validateId(contactId)) {
    return res.status(400).send({ message: 'Enter valid contact ID' });
  }

  const { isValid, errors, sanitizeContact } = validateContact(req.body);
  if (!isValid) {
    return res.status(400).send({ message: 'Invalid inputs', errors });
  }

  return Contact.findById(contactId)
    .then((foundContact) => {
      if (foundContact) {
        return Contact.update({ ...sanitizeContact }, {
          where: { id: contactId },
          plain: true,
          returning: true
        }).then((updatedContact) => {
          const contact = updatedContact[1].dataValues;
          const groupId = !Number.isNaN(parseInt(contact.groupId, 10)) ? contact.groupId : null;
          return Group.findById(groupId)
            .then((group) => {
              return res.status(200).send({ message: 'Contact updated', contact, group });
            });
        }).catch((error) => {
          return res.status(500).send({
            message: 'Internal Server Error',
            error: error.message
          });
        });
      }
      return res.status(404).send({ message: 'Contact does not exist' });
    }).catch((error) => {
      return res.status(500).send({
        message: 'Internal Server Error',
        error: error.message
      });
    });
};

export const listAllContacts = (req, res) => {
  return Contact.findAll({
    include: [
      { model: Group, as: 'group', required: false },
    ]
  }).then((contacts) => {
    return res.status(200).send({ contacts });
  }).catch((error) => {
    return res.status(500).send({
      message: 'Internal Server Error',
      error: error.message
    });
  });
};

export const deleteContact = (req, res) => {
  const { contactId } = req.params;
  if (!validateId(contactId)) {
    return res.status(400).send({ message: 'Enter valid contact ID' });
  }

  return Contact.findById(contactId)
    .then((foundContact) => {
      if (foundContact) {
        return Contact.destroy({
          where: { id: contactId }
        }).then(() => {
          return res.status(200).send({
            message: 'Contact deleted',
            contact: foundContact
          });
        }).catch((error) => {
          return res.status(500).send({
            message: 'Internal Server Error',
            error
          });
        });
      }
      return res.status(404).send({ message: 'Contact does not exist' });
    }).catch((error) => {
      return res.status(500).send({
        message: 'Internal Server Error',
        error: error.message
      });
    });
};
