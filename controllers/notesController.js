const Note = require("../models/Note");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

//@desc Get all notes
//@route GET /notes
//@access Public
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes.length) {
    return res.status(400).json({ message: "No notes found." });
  }
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, user: user.username };
    })
  );
  return res.json(notesWithUser);
});

//@desc Create note
//@route POST /notes
//@access public
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body;
  if (!user || !title || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Check for duplicate title
  const duplicate = await Note.findOne({ title }).collation({ locale: "en", strength: 2 }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  const noteObj = { user, title, text };
  const note = await Note.create(noteObj);

  if (note) {
    res.status(201).json({ message: `New note ${title} created` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

//@desc Update note
//@route PATCH /notes
//@access Private
const updateNote = asyncHandler(async (req, res) => {
  const { user, title, text, completed, id } = req.body;
  if (!id || !user || !title || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }
  const note = await Note.findById(id).exec();
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }
  //Prevent duplicate title
  const duplicate = await Note.findOne({ title }).collation({ locale: "en", strength: 2 }).lean().exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(400).json({ message: "Duplicate note title" });
  }
  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json({ message: `${note.title} updated` });
});

//@desc Delete note
//@route DELETE /notes
//@access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ message: "Note ID required" });
  }
  //Confirm note exists
  const note = await Note.findById(id).exec();
  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }
  const result = await note.deleteOne();

  const reply = `note ${note.title} with ID ${note._id} deleted`;

  return res.json(reply);
});

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
