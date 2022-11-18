'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
});

const issueSchema = new Schema({
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_on: Date,
  updated_on: Date,
  created_by: { type: String, required: true },
  assigned_to: String,
  open: { type: Boolean, default: true },
  status_text: String
}, { versionKey: false });

const projectSchema = new Schema({
  name: { type: String, required: true },
  issues: [{ type: Schema.Types.Object, ref: "Issue" }]
});

const Issue = mongoose.model("Issue", issueSchema);
const Project = mongoose.model("Project", projectSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      
      Project
        .findOne({ name: project })
        .populate({
          path: "issues",
          match: req.query
        })
        .exec((err, data) => {
          if (err) return res.send(err);

          return res.send(data.issues);
        });
    })
    
    .post(function (req, res){
      if (req.body.issue_title === "" || req.body.issue_text === ""
      || req.body.created_by === "") {
        return res.send({ error: "required field(s) missing" });      
      }

      let project = req.params.project;

      const issue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to,
        status_text: req.body.status_text
      });

      issue.save(err => {
        if (err) return res.send(err);

        Project.findOneAndUpdate(
          { name: project },
          { $push: { issues: issue._id } },
          { upsert: true },
          err => {
            if (err) return res.send(err);

            return res.send(issue);
          }
        );
      });
    })
    
    .put(function (req, res){
      if (req.body._id === "" || req.body._id === null) return res.send({ error: "missing _id"});
      
      const body = Object.assign({}, req.body);
      const keys = Object.keys(body);
      for (let i = keys.length - 1; i >= 0; --i) {
        if (body[keys[i]] === "" || body[keys[i]] === null) {
          delete body[keys[i]];
          keys.splice(i, 1);
        }
      }
      if (keys.length === 1) return res.send({ error: "no update field(s) sent", _id: body._id });
      
      const _id = body._id;
      delete body._id;
      Issue.findOneAndUpdate(
        { _id: _id },
        body,
        { new: true },
        (err, newIssue) => {
          if (err || newIssue === null) return res.send({ error: "could not update", _id: _id });

          res.send({ result: "successfully updated", _id: _id });
        }
      );
    })
    
    .delete(function (req, res){
      if (req.body._id === "" || req.body._id === null) return res.send({ error: "missing _id"});

      Issue.findByIdAndRemove(req.body._id, (err, removedIssue) => {
        if (err || removedIssue === null) return res.send({ error: "could not delete", _id: req.body._id });

        res.send({ result: "successfully deleted", _id: req.body._id });
      });
    });
    
};
