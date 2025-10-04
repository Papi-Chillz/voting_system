const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();

// Routers
const authRoutes = require('./routes/auth'); // login/logout
const voterRoutes = require('./routes/voter'); // registration + voting
const entityRoutes = require('./routes/entities'); // admin entities
const electionRoutes = require('./routes/elections'); // admin elections
const indexRoutes = require('./routes/index'); // home/dashboard
const clerkRoutes = require('./routes/clerk');
const votesRoutes = require('./routes/votes');


// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Session
app.use(session({
  secret: 'replace_with_a_strong_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Make current user available in templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Auth routes
app.use('/', authRoutes);

// Role middleware
function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) return next();
    res.status(403).send("❌ Access denied.");
  };
}

// Protected routes
app.use('/', ensureAuthenticated, indexRoutes); // Home page for all roles

// Admin-only
app.use('/entities', ensureAuthenticated, requireRole('admin'), entityRoutes);
app.use('/votes', ensureAuthenticated, requireRole('admin'), votesRoutes);
const unregisteredRoute = require("./routes/unregistered");
app.use("/unregistered", ensureAuthenticated, requireRole("admin"), unregisteredRoute);

const unCandidateRoute = require("./routes/unCandidate");
app.use("/unCandidate", ensureAuthenticated, requireRole("admin"), unCandidateRoute);

const voteStatsRoute = require("./routes/voteStats");
app.use("/voteStats",  ensureAuthenticated, requireRole("admin"),voteStatsRoute);

const voidVotesRoute = require('./routes/voidVotes');
app.use('/voidVotes', ensureAuthenticated, requireRole("admin"), voidVotesRoute);

const ageGroupsRouter = require('./routes/ageGroups');
app.use('/ageGroups',ensureAuthenticated, requireRole("admin"), ageGroupsRouter);

const candidatesRouter = require('./routes/candidates');
app.use('/candidates', ensureAuthenticated, requireRole("admin"), candidatesRouter);


// Clerk-onl
app.use("/register", ensureAuthenticated, requireRole('clerk'), clerkRoutes);

// Voter-only
app.use("/vote", ensureAuthenticated, requireRole('voter'), voterRoutes);
app.use('/elections', ensureAuthenticated, requireRole('admin'), electionRoutes);

app.use(express.static('public'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
