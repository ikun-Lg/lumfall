<template>
  <main class="health-page">
    <header class="topbar">
      <a class="wordmark" href="/view/health" aria-label="Lumfall 健康检查首页">
        <span class="wordmark-mark">S</span>
        <span>{{ frameworkName }} <small>SERVICE HEALTH</small></span>
      </a>
      <div class="topbar-meta">
        <span class="environment"><i></i>{{ environment }} ENVIRONMENT</span>
        <button
          class="refresh-button"
          type="button"
          :disabled="loading"
          aria-label="重新检查服务健康状态"
          @click="refresh"
        >
          <span :class="{ spinning: loading }" aria-hidden="true">↻</span>
          {{ loading ? "检查中" : "重新检查" }}
        </button>
      </div>
    </header>

    <section class="overview" :class="`overview-${overallStatus}`" aria-labelledby="page-title">
      <div class="overview-copy">
        <p class="eyebrow">LUMFALL / RUNTIME STATUS</p>
        <h1 id="page-title">服务健康</h1>
        <p class="overview-description">
          分开检查进程存活与服务就绪。依赖探针失败时，服务会暂时退出流量池。
        </p>
      </div>
      <div class="overall-status" :class="`status-${overallStatus}`" aria-live="polite">
        <span class="status-mark" aria-hidden="true"></span>
        <span>
          <strong>{{ statusTitle }}</strong>
          <small>{{ updatedAt ? `最近检查 ${updatedAt}` : "等待检查" }}</small>
        </span>
      </div>
      <div class="overview-rule" aria-hidden="true"></div>
      <div class="overview-facts">
        <div>
          <span class="fact-label">应用</span>
          <strong>{{ frameworkName }}</strong>
        </div>
        <div>
          <span class="fact-label">依赖探针</span>
          <strong>{{ dependencyChecks.length }} 项</strong>
        </div>
        <div>
          <span class="fact-label">运行环境</span>
          <strong>{{ environment }}</strong>
        </div>
      </div>
    </section>

    <section class="probe-section" aria-labelledby="probe-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">STANDARD PROBES</p>
          <h2 id="probe-title">标准探针</h2>
        </div>
        <span class="section-note">供负载均衡器与编排平台调用</span>
      </div>

      <div class="probe-grid" :aria-busy="loading">
        <article
          v-for="probe in standardProbes"
          :key="probe.key"
          class="probe-panel"
          :class="`probe-${probe.result.status}`"
        >
          <div class="probe-heading">
            <div>
              <span class="probe-kicker">{{ probe.kicker }}</span>
              <h3>{{ probe.name }}</h3>
            </div>
            <span class="probe-state" :class="`state-${probe.result.status}`">
              {{ statusLabel(probe.result.status) }}
            </span>
          </div>
          <p class="probe-endpoint"><code>{{ probe.endpoint }}</code></p>
          <p class="probe-description">{{ probe.description }}</p>
          <div class="probe-metrics">
            <span>HTTP {{ probe.result.httpStatus || "--" }}</span>
            <span>{{ formatDuration(probe.result.durationMs) }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="dependency-section" aria-labelledby="dependency-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">APPLICATION-DEFINED</p>
          <h2 id="dependency-title">依赖探针</h2>
        </div>
        <span class="section-note">由业务应用注册</span>
      </div>

      <div v-if="dependencyChecks.length" class="dependency-list">
        <div v-for="check in dependencyChecks" :key="check.name" class="dependency-row">
          <span class="dependency-indicator" :class="`indicator-${check.status}`"></span>
          <strong>{{ check.name }}</strong>
          <code>{{ check.status === "ok" ? "PASS" : "FAIL" }}</code>
        </div>
      </div>
      <div v-else class="empty-state">
        <span class="empty-mark" aria-hidden="true">+</span>
        <div>
          <strong>尚未注册外部依赖探针</strong>
          <p>应用可注册数据库、缓存或关键服务检查；未注册时，只确认 Lumfall 已完成启动。</p>
        </div>
        <a href="/health/ready" target="_blank" rel="noreferrer">就绪响应 <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <footer class="page-footer">
      <span>LIVE <code>/health/live</code></span>
      <span>READY <code>/health/ready</code></span>
      <span>NO STORE · NO SENSITIVE DETAILS</span>
    </footer>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

const frameworkName = window.__LUMFALL__?.name || "Lumfall";
const environment = (window.__LUMFALL__?.env || "unknown").toUpperCase();
const loading = ref(false);
const updatedAt = ref("");
const liveResult = ref({ status: "loading", httpStatus: null, durationMs: null });
const readyResult = ref({ status: "loading", httpStatus: null, durationMs: null, checks: [] });

const standardProbes = computed(() => [
  {
    key: "live",
    kicker: "PROCESS",
    name: "存活检查",
    endpoint: "GET /health/live",
    description: "只确认进程能及时响应，不依赖数据库或外部服务。",
    result: liveResult.value,
  },
  {
    key: "ready",
    kicker: "TRAFFIC",
    name: "就绪检查",
    endpoint: "GET /health/ready",
    description: "运行应用注册的依赖探针；任一失败或超时则返回 HTTP 503。",
    result: readyResult.value,
  },
]);

const dependencyChecks = computed(() => readyResult.value.checks || []);

const overallStatus = computed(() => {
  if (loading.value || liveResult.value.status === "loading") return "loading";
  if (liveResult.value.status !== "ok") return "error";
  if (readyResult.value.status !== "ok") return "warning";
  return "ok";
});

const statusTitle = computed(() => {
  if (overallStatus.value === "loading") return "正在检查";
  if (overallStatus.value === "error") return "进程不可用";
  if (overallStatus.value === "warning") return "服务未就绪";
  return "运行正常";
});

function statusLabel(status) {
  return { loading: "检查中", ok: "正常", error: "异常" }[status] || "未知";
}

function formatDuration(durationMs) {
  return Number.isFinite(durationMs) ? `${durationMs.toFixed(0)} ms` : "-- ms";
}

async function requestProbe(endpoint) {
  const startedAt = performance.now();

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await response.json();
    return {
      status: response.ok && body.status === "ok" ? "ok" : "error",
      httpStatus: response.status,
      durationMs: performance.now() - startedAt,
      checks: body.checks || [],
    };
  } catch {
    return {
      status: "error",
      httpStatus: null,
      durationMs: performance.now() - startedAt,
      checks: [],
    };
  }
}

async function refresh() {
  loading.value = true;
  const [live, ready] = await Promise.all([
    requestProbe("/health/live"),
    requestProbe("/health/ready"),
  ]);
  liveResult.value = live;
  readyResult.value = ready;
  updatedAt.value = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  loading.value = false;
}

onMounted(refresh);
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background: #f4f3ed;
}

.health-page {
  --ink: #173a32;
  --muted: #5d6e67;
  --line: #d7d9cf;
  --coral: #d85d43;
  --lime: #d8e77a;
  min-height: 100vh;
  padding: 0 7.2vw;
  overflow: hidden;
  color: var(--ink);
  font-family: "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif;
  background-color: #f4f3ed;
  background-image: linear-gradient(rgba(23, 58, 50, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(23, 58, 50, 0.025) 1px, transparent 1px);
  background-size: 32px 32px;
  animation: arrive 420ms ease-out both;
}

.topbar,
.wordmark,
.topbar-meta,
.environment,
.refresh-button,
.section-heading,
.probe-heading,
.probe-metrics,
.dependency-row,
.page-footer {
  display: flex;
  align-items: center;
}

.topbar {
  min-height: 78px;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}

.wordmark {
  gap: 11px;
  color: var(--ink);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
}

.wordmark small {
  margin-left: 8px;
  color: #77847b;
  font-size: 9px;
  font-weight: 600;
}

.wordmark-mark {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  color: #f4f3ed;
  background: var(--ink);
  border-radius: 50%;
  font-family: Georgia, serif;
  font-size: 18px;
}

.topbar-meta {
  gap: 24px;
}

.environment {
  gap: 8px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
}

.environment i {
  width: 8px;
  height: 8px;
  background: #689b57;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(104, 155, 87, 0.15);
}

.refresh-button {
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  color: #fff;
  background: var(--ink);
  border: 0;
  border-radius: 4px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;
}

.refresh-button:hover:not(:disabled) {
  background: #28564b;
  transform: translateY(-1px);
}

.refresh-button:disabled {
  cursor: progress;
}

.refresh-button span {
  font-size: 17px;
  line-height: 1;
}

.spinning {
  animation: rotate 900ms linear infinite;
}

.overview {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px 40px;
  padding: 45px 0 27px;
  border-bottom: 1px solid var(--line);
}

.overview-copy .eyebrow,
.section-heading .eyebrow {
  margin: 0 0 9px;
  color: var(--coral);
  font-size: 10px;
  font-weight: 800;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1,
h2 {
  margin-bottom: 0;
  font-family: Georgia, "Songti SC", serif;
  font-weight: 500;
}

h1 {
  font-size: 48px;
  line-height: 1.1;
}

.overview-description {
  max-width: 530px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.overall-status {
  display: flex;
  min-width: 190px;
  align-items: center;
  gap: 13px;
  padding: 15px 19px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--line);
}

.status-mark {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  background: #689b57;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgba(104, 155, 87, 0.14);
}

.status-warning .status-mark {
  background: #c17a2b;
  box-shadow: 0 0 0 5px rgba(193, 122, 43, 0.14);
}

.status-error .status-mark {
  background: var(--coral);
  box-shadow: 0 0 0 5px rgba(216, 93, 67, 0.14);
}

.overall-status strong,
.overall-status small {
  display: block;
}

.overall-status strong {
  font-size: 13px;
}

.overall-status small {
  margin-top: 5px;
  color: var(--muted);
  font-size: 10px;
}

.overview-rule {
  grid-column: 1 / -1;
  height: 1px;
  background: var(--line);
}

.overview-facts {
  display: flex;
  grid-column: 1 / -1;
  gap: clamp(28px, 8vw, 110px);
}

.overview-facts div {
  display: grid;
  gap: 5px;
}

.fact-label {
  color: var(--muted);
  font-size: 10px;
}

.overview-facts strong {
  font-size: 12px;
}

.probe-section,
.dependency-section {
  padding: 33px 0 37px;
  border-bottom: 1px solid var(--line);
}

.section-heading {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-heading .eyebrow {
  margin-bottom: 7px;
}

h2 {
  font-size: 25px;
}

.section-note {
  color: var(--muted);
  font-size: 11px;
}

.probe-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.probe-panel {
  min-width: 0;
  padding: 19px 20px 14px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--line);
  border-top: 3px solid var(--ink);
  animation: panel-arrive 380ms ease-out both;
}

.probe-panel:nth-child(2) {
  animation-delay: 70ms;
}

.probe-error {
  border-top-color: var(--coral);
}

.probe-warning {
  border-top-color: #c17a2b;
}

.probe-heading {
  justify-content: space-between;
  gap: 14px;
}

.probe-kicker {
  color: #78857b;
  font-size: 9px;
  font-weight: 800;
}

h3 {
  margin: 5px 0 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: 21px;
  font-weight: 600;
}

.probe-state {
  padding: 6px 9px;
  color: #37653d;
  background: #e4ecd9;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
}

.state-error {
  color: #812f20;
  background: #f7e0d9;
}

.state-loading {
  color: #596b61;
  background: #e6e9e0;
}

.probe-endpoint {
  margin: 14px 0 9px;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
}

.probe-endpoint code {
  color: var(--ink);
}

.probe-description {
  min-height: 36px;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.65;
}

.probe-metrics {
  justify-content: space-between;
  gap: 12px;
  margin-top: 13px;
  padding-top: 10px;
  color: #6a796e;
  border-top: 1px solid #e4e5dc;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
}

.dependency-list {
  border-top: 1px solid var(--line);
}

.dependency-row {
  min-height: 49px;
  gap: 12px;
  border-bottom: 1px solid var(--line);
}

.dependency-row strong {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.dependency-row code {
  color: #37653d;
  font-size: 9px;
}

.dependency-row code:last-child {
  min-width: 40px;
  text-align: right;
}

.dependency-indicator {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  background: #689b57;
  border-radius: 50%;
}

.indicator-error {
  background: var(--coral);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 17px 0;
  border-top: 1px solid var(--line);
}

.empty-mark {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--ink);
  background: var(--lime);
  border-radius: 50%;
  font-size: 19px;
}

.empty-state strong {
  font-size: 12px;
}

.empty-state p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.empty-state a {
  margin-left: auto;
  color: var(--ink);
  font-size: 10px;
  text-decoration: none;
  white-space: nowrap;
}

.empty-state a:hover,
.page-footer code {
  color: var(--coral);
}

.page-footer {
  min-height: 59px;
  justify-content: space-between;
  gap: 14px;
  color: #68776d;
  font-size: 9px;
  font-weight: 700;
}

.page-footer code {
  margin-left: 5px;
}

@keyframes arrive {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes panel-arrive {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .health-page {
    padding: 0 5vw;
  }

  .overview {
    gap: 18px;
  }

  .overall-status {
    min-width: auto;
    padding: 12px;
  }

  .probe-grid {
    gap: 9px;
  }

  .probe-panel {
    padding: 15px 13px 12px;
  }
}

@media (max-width: 560px) {
  .health-page {
    padding: 0 20px;
    background-size: 24px 24px;
  }

  .topbar {
    min-height: 66px;
  }

  .wordmark small,
  .environment {
    display: none;
  }

  .topbar-meta {
    gap: 0;
  }

  .overview {
    grid-template-columns: 1fr;
    padding: 34px 0 22px;
  }

  h1 {
    font-size: 40px;
  }

  .overview-description {
    max-width: 360px;
    font-size: 12px;
  }

  .overall-status {
    width: fit-content;
  }

  .overview-facts {
    justify-content: space-between;
    gap: 12px;
  }

  .probe-section,
  .dependency-section {
    padding: 26px 0 29px;
  }

  .section-heading {
    align-items: flex-start;
  }

  .section-note {
    max-width: 112px;
    padding-top: 18px;
    text-align: right;
    line-height: 1.5;
  }

  .probe-grid {
    grid-template-columns: 1fr;
  }

  .probe-description {
    min-height: 0;
  }

  .empty-state {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .empty-state > div {
    flex: 1;
    min-width: 0;
  }

  .empty-state a {
    margin-left: 46px;
  }

  .page-footer {
    min-height: 68px;
    flex-wrap: wrap;
    justify-content: flex-start;
    column-gap: 18px;
    row-gap: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>