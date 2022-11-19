const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);
  suite("Tests POST requests to /api/issues/{project}", () => {
    test("Create an issue with every field", done => {
        chai
            .request(server)
            .post("/api/issues/functional_test")
            .send({
                issue_title: "title#1",
                issue_text: "text#1",
                created_by: "chai",
                assigned_to: "agent#1",
                status_text: "initial post"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.issue_title, "title#1");
                assert.equal(res.body.issue_text, "text#1");
                assert.equal(res.body.created_by, "chai");
                assert.equal(res.body.assigned_to, "agent#1");
                assert.equal(res.body.status_text, "initial post");
                assert.equal(res.body.open, true);
                assert.property(res.body, "_id");
                assert.property(res.body, "created_on");
                assert.property(res.body, "updated_on");
                done();
            });
    });
    test("Create an issue with only required fields", done => {
        chai
            .request(server)
            .post("/api/issues/functional_test")
            .send({
                issue_title: "title#2",
                issue_text: "text#2",
                created_by: "chai"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.issue_title, "title#2");
                assert.equal(res.body.issue_text, "text#2");
                assert.equal(res.body.created_by, "chai");
                assert.equal(res.body.open, true);
                assert.property(res.body, "assigned_to");
                assert.property(res.body, "status_text");
                assert.property(res.body, "_id");
                assert.property(res.body, "created_on");
                assert.property(res.body, "updated_on");
                done();
            });
    });
    test("Create an issue with missing required fields", done => {
        chai
            .request(server)
            .post("/api/issues/functional_test")
            .send({
                assigned_to: "agent#3",
                status_text: "initial post"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "required field(s) missing");
                done();
            });
    });
  });
  suite("Tests GET requests to /api/issues/{project}", () => {
    test("View issues on a project", done => {
        chai
            .request(server)
            .get('/api/issues/functional_test')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.typeOf(res.body, "array");
                done();
            });
    });
    test("View issue on a project with one filter", done => {
        chai
            .request(server)
            .get('/api/issues/functional_test?open=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.typeOf(res.body, "array");
                res.body.forEach(issue => {
                    assert.equal(issue.open, true);
                })
                done();
            });
    });
    test("View issue on a project with multiple filters", done => {
        chai
            .request(server)
            .get('/api/issues/functional_test?created_by=chai&status_text=initial+post')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.typeOf(res.body, "array");
                res.body.forEach(issue => {
                    assert.equal(issue.created_by, "chai");
                    assert.equal(issue.status_text, "initial post");
                })
                done();
            });
    });
  });
  suite("Tests PUT requests to /api/issues/{project}", () => {
    test("Update one field on an issue", done => {
        chai
            .request(server)
            .put("/api/issues/functional_test")
            .send({
                _id: "6377f446b5fb9d8c875ce695",
                open: false
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.result, "successfully updated");
                assert.equal(res.body._id, "6377f446b5fb9d8c875ce695");
                done();
            });
    });
    test("Update multiple fields on an issue", done => {
        chai
            .request(server)
            .put("/api/issues/functional_test")
            .send({
                _id: "6377f446b5fb9d8c875ce695",
                status_text: "done",
                assigned_to: "nobody"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.result, "successfully updated");
                assert.equal(res.body._id, "6377f446b5fb9d8c875ce695");
                done();
            });
    });
    test("Update an issue with missing _id", done => {
        chai
            .request(server)
            .put("/api/issues/functional_test")
            .send({
                assigned_to: "?",
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "missing _id");
                done();
            });
    });
    test("Update an issue with no fields to update", done => {
        chai
            .request(server)
            .put("/api/issues/functional_test")
            .send({
                _id: "6377f446b5fb9d8c875ce695",
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "no update field(s) sent");
                assert.equal(res.body._id, "6377f446b5fb9d8c875ce695");
                done();
            });
    });
    test("Update an issue with an invalid _id", done => {
        chai
            .request(server)
            .put("/api/issues/functional_test")
            .send({
                _id: "1nv4l1d_1d",
                status_text: "???"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "could not update");
                assert.equal(res.body._id, "1nv4l1d_1d");
                done();
            });
    });
  });
  suite("Tests DELETE requests to /api/issues/{project}", () => {
    test("Delete an issue", done => {
        chai
            .request(server)
            .delete("/api/issues/functional_test")
            .send({
                _id: "*" // * should be valid _id
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.result, "successfully deleted");
                assert.equal(res.body._id, "*"); // * should be valid _id
                done();
            });
    });
    test("Delete an issue with an invalid _id", done => {
        chai
            .request(server)
            .delete("/api/issues/functional_test")
            .send({
                _id: "1nv4l1d_1d"
            })
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "could not delete");
                assert.equal(res.body._id, "1nv4l1d_1d");
                done();
            });
    });
    test("Delete an issue with missing _id", done => {
        chai
            .request(server)
            .delete("/api/issues/functional_test")
            .send({})
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.equal(res.body.error, "missing _id");
                done();
            });
    });
  });
});
