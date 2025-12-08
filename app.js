// ========== 1. CONFIGURAR FIREBASE ==========

const firebaseConfig = {
  apiKey: "AIzaSyDN9cO2WmqRw2S3rwngDk4LOm-fi8VrJHk",
  authDomain: "formulariosenai-f7a0a.firebaseapp.com",
  projectId: "formulariosenai-f7a0a",
  storageBucket: "formulariosenai-f7a0a.firebasestorage.app",
  messagingSenderId: "234848959042",
  appId: "1:234848959042:web:c273bba3a64c0e06420bdb"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========== 2. DADOS DO QUESTIONÁRIO ==========

const profiles = [
  {
    id: "R",
    name: "Realista",
    description:
      "Gosta de atividades práticas, com máquinas, ferramentas e objetos.",
    courses: ["Mecânica", "Automação", "Usinagem", "Eletricidade"],
    questions: [
      "Gosto de trabalhar com ferramentas, máquinas ou objetos.",
      "Prefiro atividades práticas a discussões teóricas.",
      "Gosto de consertar, montar ou construir coisas.",
      "Prefiro ambientes organizados e tarefas manuais."
    ]
  },
  {
    id: "I",
    name: "Investigativo",
    description:
      "Envolve curiosidade, ciência, pesquisa e resolução de problemas.",
    courses: ["Tecnologia da Informação", "Eletroeletrônica", "Manutenção"],
    questions: [
      "Gosto de resolver problemas complexos.",
      "Tenho interesse em ciência, pesquisa ou experimentos.",
      "Gosto de analisar informações e entender como as coisas funcionam.",
      "Prefiro atividades que envolvam reflexão e lógica."
    ]
  },
  {
    id: "A",
    name: "Artístico",
    description:
      "Ligado a criação, desenho, música, comunicação visual e expressão.",
    courses: ["Design de Produto", "Impressão 3D", "Comunicação Visual"],
    questions: [
      "Gosto de criar, desenhar, inventar ou expressar ideias.",
      "Prefiro atividades com liberdade e sem regras rígidas.",
      "Gosto de música, artes visuais, escrita ou atuação.",
      "Sou imaginativo(a) e busco formas diferentes de fazer as coisas."
    ]
  },
  {
    id: "S",
    name: "Social",
    description:
      "Foco em ajudar pessoas, ensinar, orientar e atuar em equipe.",
    courses: ["Segurança do Trabalho", "Educação", "Saúde Ocupacional"],
    questions: [
      "Gosto de ajudar, orientar ou cuidar de pessoas.",
      "Tenho facilidade para ouvir e compreender os outros.",
      "Prefiro atividades que envolvem ensinar ou apoiar alguém.",
      "Gosto de trabalhar em equipe e apoiar o bem-estar coletivo."
    ]
  },
  {
    id: "E",
    name: "Empreendedor",
    description:
      "Ligado a liderança, vendas, metas, resultados e tomada de decisões.",
    courses: ["Gestão", "Vendas Técnicas", "Logística"],
    questions: [
      "Gosto de liderar, convencer ou motivar pessoas.",
      "Tenho iniciativa e gosto de tomar decisões.",
      "Prefiro desafios que envolvam resultados e metas.",
      "Gosto de criar projetos e colocar ideias em prática."
    ]
  },
  {
    id: "C",
    name: "Convencional",
    description:
      "Organização, planejamento, documentos, rotinas e detalhamento.",
    courses: ["Administração", "Controle de Qualidade", "Planejamento"],
    questions: [
      "Gosto de organizar, planejar e manter tudo em ordem.",
      "Prefiro atividades com regras claras e rotina.",
      "Gosto de trabalhar com documentos, tabelas ou registros.",
      "Sou detalhista e cuidadoso(a) com informações."
    ]
  }
];

const SCORE_SCALE = [
  "Nada a ver (0)",
  "Pouco (1)",
  "Parcialmente (2)",
  "Bastante (3)",
  "Totalmente (4)"
];

// Estado do quiz
let currentProfileIndex = 0;
let answers = {}; // { R: [0,1,2,3], I: [...] }

// ========== 3. ELEMENTOS DA INTERFACE ==========

// Screens
const authScreen = document.getElementById("authScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

// Auth
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const resetModal = document.getElementById("resetModal");
const sendResetLinkBtn = document.getElementById("sendResetLink");
const closeResetModalBtn = document.getElementById("closeResetModal");

// Quiz
const quizStep = document.getElementById("quizStep");
const profileTitle = document.getElementById("profileTitle");
const profileDescription = document.getElementById("profileDescription");
const questionsForm = document.getElementById("questionsForm");
const nextProfileBtn = document.getElementById("nextProfileBtn");

// Result
const resultSummary = document.getElementById("resultSummary");
const scoresGrid = document.getElementById("scoresGrid");
const coursesList = document.getElementById("coursesList");
const redoQuizBtn = document.getElementById("redoQuizBtn");
const logoutFromResultBtn = document.getElementById("logoutFromResultBtn");

// Outros
const userInfo = document.getElementById("userInfo");
const toastEl = document.getElementById("toast");

// ========== 4. FUNÇÕES DE UI ==========

function showScreen(screen) {
  [authScreen, quizScreen, resultScreen].forEach((s) =>
    s.classList.remove("active")
  );
  screen.classList.add("active");
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), 2800);
}

function setUserInfo(userDoc) {
  if (!userDoc) {
    userInfo.innerHTML = "";
    return;
  }
  userInfo.innerHTML = `
    <span>Olá, <strong>${userDoc.name || "Aluno"}</strong></span>
    <button id="logoutBtnHeader">Sair</button>
  `;
  document
    .getElementById("logoutBtnHeader")
    .addEventListener("click", () => auth.signOut());
}

// Atualiza bolinhas da barra de progresso
function updateProgressBar() {
  const items = document.querySelectorAll(".progress-item");
  items.forEach((item, index) => {
    item.classList.remove("active", "completed");
    if (index < currentProfileIndex) {
      item.classList.add("completed");
    } else if (index === currentProfileIndex) {
      item.classList.add("active");
    }
  });
}

// Monta as perguntas do perfil atual
function renderCurrentProfile() {
  const profile = profiles[currentProfileIndex];
  quizStep.textContent = `Perfil ${currentProfileIndex + 1} de ${
    profiles.length
  }`;
  profileTitle.textContent = `Perfil ${currentProfileIndex + 1} de 6`;
  profileDescription.textContent = "";
  profileDescription.style.display = "none";

  updateProgressBar();

  questionsForm.innerHTML = "";

  const previousAnswers = answers[profile.id] || [];

  profile.questions.forEach((question, qIndex) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-item";

    const p = document.createElement("p");
    p.className = "question-text";
    p.textContent = `${qIndex + 1}. ${question}`;
    questionDiv.appendChild(p);

    const optionsRow = document.createElement("div");
    optionsRow.className = "options-row";

    for (let value = 0; value <= 4; value++) {
      const label = document.createElement("label");
      label.className = "option-pill";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${qIndex}`;
      input.value = value;

      if (previousAnswers[qIndex] === value) {
        input.checked = true;
      }

      label.appendChild(input);
      label.appendChild(document.createTextNode(`${value}`));

      optionsRow.appendChild(label);
    }

    questionDiv.appendChild(optionsRow);
    questionsForm.appendChild(questionDiv);
  });

  nextProfileBtn.textContent =
    currentProfileIndex === profiles.length - 1
      ? "Salvar e ver resultado"
      : "Salvar e avançar";
}

// Coleta as respostas do perfil atual (retorna array de 4 números ou null)
function collectCurrentAnswers() {
  const profile = profiles[currentProfileIndex];
  const currentAnswers = [];

  for (let qIndex = 0; qIndex < profile.questions.length; qIndex++) {
    const selected = document.querySelector(
      `input[name="q${qIndex}"]:checked`
    );
    if (!selected) {
      return null; // pergunta sem resposta
    }
    currentAnswers.push(Number(selected.value));
  }
  return currentAnswers;
}

// Calcula pontuações finais
function calculateScores() {
  const scores = {};
  profiles.forEach((profile) => {
    const arr = answers[profile.id] || [];
    scores[profile.id] = arr.reduce((sum, v) => sum + v, 0);
  });
  return scores;
}

// Gera lista de cursos recomendados a partir dos melhores perfis
function getRecommendedCourses(scores) {
  const maxScore = Math.max(...Object.values(scores));
  const bestProfiles = Object.keys(scores).filter(
    (key) => scores[key] === maxScore
  );

  const coursesSet = new Set();
  profiles.forEach((profile) => {
    if (bestProfiles.includes(profile.id)) {
      profile.courses.forEach((c) => coursesSet.add(c));
    }
  });

  return {
    bestProfiles,
    courses: Array.from(coursesSet),
    maxScore
  };
}

// Mostra tela de resultado
function showResultScreen(scores) {
  const { bestProfiles, courses, maxScore } = getRecommendedCourses(scores);

  const bestNames = profiles
    .filter((p) => bestProfiles.includes(p.id))
    .map((p) => `${p.name} (${p.id})`)
    .join(" e ");

  resultSummary.textContent = `Seu(s) perfil(is) com maior pontuação (${maxScore}) foi(foram): ${bestNames}.`;

  scoresGrid.innerHTML = "";
  profiles.forEach((p) => {
    const div = document.createElement("div");
    div.className = "profile-score";
   const profileNumber = profiles.indexOf(p) + 1;

   div.innerHTML = `
  <h4>Perfil ${profileNumber}</h4>
  <p>Pontuação: <strong>${scores[p.id]}</strong></p>
`;

    scoresGrid.appendChild(div);
  });

  coursesList.innerHTML = "";
  if (courses.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      "Ainda não há cursos mapeados para esses perfis. Procure o orientador.";
    coursesList.appendChild(li);
  } else {
    courses.forEach((course) => {
      const li = document.createElement("li");
      li.textContent = course;
      coursesList.appendChild(li);
    });
  }

  showScreen(resultScreen);
}

// ========== 5. FIRESTORE (SALVAR / CARREGAR) ==========

async function saveUserAnswers(user, answers, scores) {
  const recommended = getRecommendedCourses(scores);

  const docRef = db.collection("users").doc(user.uid);
  await docRef.set(
    {
      name: user.displayName || null,
      email: user.email,
      answers,
      scores,
      bestProfiles: recommended.bestProfiles,
      recommendedCourses: recommended.courses,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function loadUserData(user) {
  const docRef = db.collection("users").doc(user.uid);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  return snap.data();
}

// ========== 6. AUTENTICAÇÃO ==========

// Tabs
tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast("Login realizado!");
  } catch (err) {
    console.error(err);
    showToast("Erro ao entrar: " + err.message);
  }
});

// Cadastro
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });

    // Também cria doc básico
    await db.collection("users").doc(cred.user.uid).set({
      name,
      email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast("Conta criada! Você já está logado.");
  } catch (err) {
    console.error(err);
    showToast("Erro ao criar conta: " + err.message);
  }
});

// Reset senha
forgotPasswordBtn.addEventListener("click", () => {
  resetModal.classList.remove("hidden");
  document.getElementById("resetEmail").value =
    document.getElementById("loginEmail").value;
});

closeResetModalBtn.addEventListener("click", () => {
  resetModal.classList.add("hidden");
});

sendResetLinkBtn.addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim();
  if (!email) {
    showToast("Informe o e-mail.");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    showToast("Link de redefinição enviado.");
    resetModal.classList.add("hidden");
  } catch (err) {
    console.error(err);
    showToast("Erro ao enviar link: " + err.message);
  }
});

// Listener global de auth
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    showScreen(authScreen);
    setUserInfo(null);
    return;
  }

  const userDoc = await loadUserData(user);
  setUserInfo({
    name: userDoc?.name || user.displayName || "Aluno",
    email: user.email
  });

  if (userDoc?.answers && userDoc?.scores) {
    // Usuário já respondeu tudo: mostra resultado
    answers = userDoc.answers;
    const scores = userDoc.scores;
    showResultScreen(scores);
  } else {
    // Começa / continua o questionário
    currentProfileIndex = 0;
    renderCurrentProfile();
    showScreen(quizScreen);
  }
});

// Deslogar da tela de resultado
logoutFromResultBtn.addEventListener("click", () => auth.signOut());

// ========== 7. FLUXO DO QUESTIONÁRIO ==========

nextProfileBtn.addEventListener("click", async () => {
  const currentAnswers = collectCurrentAnswers();
  if (!currentAnswers) {
    showToast("Responda todas as perguntas antes de continuar.");
    return;
  }

  const profile = profiles[currentProfileIndex];
  answers[profile.id] = currentAnswers;

  if (currentProfileIndex < profiles.length - 1) {
    currentProfileIndex++;
    renderCurrentProfile();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Último perfil: calcula e salva
  const user = auth.currentUser;
  if (!user) {
    showToast("Sessão expirada, faça login novamente.");
    auth.signOut();
    return;
  }

  const scores = calculateScores();
  try {
    await saveUserAnswers(user, answers, scores);
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar respostas no servidor.");
  }

  showResultScreen(scores);
});

// Refazer questionário
redoQuizBtn.addEventListener("click", () => {
  answers = {};
  currentProfileIndex = 0;
  renderCurrentProfile();
  showScreen(quizScreen);
});
