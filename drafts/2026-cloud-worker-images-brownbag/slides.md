---
theme: default
title: Cloud Worker Images — Build, Test, Ship
---

<div class="title-slide">
  <div>
    <p class="eyebrow">Mozilla Release Operations</p>
    <h1>Cloud Worker Images<br><span>Build, Test, Ship</span></h1>
    <p class="subtitle">How RelOps delivers Windows Azure and Linux GCP images for Firefox CI.</p>
    <p class="title-meta">August 2026</p>
    <p class="title-source"><a href="https://github.com/mozilla-platform-ops/">github.com/mozilla-platform-ops</a></p>
  </div>
</div>


---

# One lifecycle, four gates

<div class="flow">
  <div class="card step"><div class="num">01</div><h3>Build</h3><p>Create an immutable cloud image with GitHub Actions and Packer.</p></div>
  <div class="card step"><div class="num">02</div><h3>Validate</h3><p>Run image checks and OS integration tasks on alpha pools.</p></div>
  <div class="card step"><div class="num">03</div><h3>Promote</h3><p>Change the image binding in <code>fxci-config</code>.</p></div>
  <div class="card step"><div class="num">04</div><h3>Observe</h3><p>Check new workers, errors, queues, and rollout health.</p></div>
</div>

<div class="callout">
  <p><strong>The build is only the first gate.</strong> A published image is not ready for production until validation is complete.</p>
</div>

<!--
Start with the complete lifecycle. Most mistakes happen when we treat a successful Packer job as the end of the release.
-->

---

# Why Firefox developers should care

Worker images are part of the Firefox test environment. An image change can change test results without a Gecko change.

<div class="signal-grid">
  <div class="card"><h3>Graphics and media</h3><p>GPU drivers, codecs, audio devices, display settings, and hardware acceleration.</p></div>
  <div class="card"><h3>Timing and performance</h3><p>VM shape, power policy, storage, timers, and background services.</p></div>
  <div class="card"><h3>Build and test tools</h3><p>Compilers, SDKs, runtimes, browsers, Python, and MozillaBuild.</p></div>
  <div class="card"><h3>Task execution</h3><p>Generic Worker, permissions, caches, networking, logs, and cleanup.</p></div>
</div>

<div class="callout">
  <p>When a test is red only on a new image, RelOps and the test owner must decide whether the image broke the test contract or exposed a Gecko defect.</p>
</div>

---

# Three repositories, three decisions

<div class="report-flow" style="--columns: 4">
  <section class="report-stage" data-step="01"><h3><code>ronin_puppet</code></h3><p>Defines the Windows OS state, software, policy, and Taskcluster packages.</p></section>
  <section class="report-stage" data-step="02"><h3><code>worker-images</code></h3><p>Builds the image, runs image tests, and creates the SBOM.</p></section>
  <section class="report-stage" data-step="03"><h3><code>fxci-config</code></h3><p>Maps each worker pool to a published image version.</p></section>
  <section class="report-stage" data-step="04"><h3>Firefox CI</h3><p>New cloud workers use the image selected for their pool.</p></section>
</div>

<p class="source-link">Canonical repositories: <a href="https://github.com/mozilla-platform-ops/ronin_puppet">ronin_puppet</a> · <a href="https://github.com/mozilla-platform-ops/worker-images">worker-images</a> · <a href="https://github.com/mozilla-releng/fxci-config">fxci-config</a></p>

<!--
These repositories answer different questions: What is in the host? How do we build it? Which version does each pool use?
-->

---

# The image is part of the test environment

The image contains the operating system and tools that a task uses. Image changes can affect test results.

<div class="stack" style="margin-top: 18px">
  <div class="layer"><strong>Operating system</strong><span>Windows or Ubuntu, drivers, services, and system settings.</span></div>
  <div class="layer"><strong>Build and test tools</strong><span>Compilers, SDKs, runtimes, browsers, Python, and MozillaBuild.</span></div>
  <div class="layer"><strong>Task execution</strong><span>Generic Worker, Taskcluster Proxy, Live Log, permissions, and task configuration.</span></div>
  <div class="layer"><strong>Image setup</strong><span>Windows uses <code>ronin_puppet</code>. Linux uses provisioning scripts from <code>worker-images</code>.</span></div>
</div>

<div class="callout">
  <p>Open the image's <a href="https://github.com/mozilla-platform-ops/worker-images/tree/main/sboms">SBOM and release notes</a> for the exact contents. They list the OS, configuration revision, Taskcluster binaries, packages, and drivers.</p>
</div>

<!--
Worker-Runner starts Generic Worker. Its binary is named start-worker. Taskcluster Worker Manager is a service outside the image. The ticket uses the term cloud-worker, but that term does not name a binary in the image.
-->

---

# The build control plane

<div class="report-flow spacious" style="--columns: 3">
  <section class="report-stage" data-step="01">
    <h3>Choose the build</h3>
    <p>GitHub Actions reads <code>config/*.yaml</code>: base OS, image type, architecture, and Taskcluster version.</p>
  </section>
  <section class="report-stage emphasis" data-step="02">
    <h3>Assemble the image</h3>
    <p>Packer creates the image. Windows uses <code>ronin_puppet</code>; Linux uses provisioning scripts.</p>
  </section>
  <section class="report-stage" data-step="03">
    <h3>Publish the release</h3>
    <p>The workflow creates an Azure gallery or GCE image, runs checks, and writes the SBOM and release notes.</p>
  </section>
</div>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

---

# Windows: Azure Compute Gallery

<div class="two-col">
  <div>
    <h3>Build identity</h3>
    <ul>
      <li><code>image_version</code> identifies the Azure gallery version.</li>
      <li><code>deploymentId</code> pins a <code>ronin_puppet</code> commit.</li>
      <li>The config also selects the Marketplace base image and VM shape.</li>
    </ul>
  </div>
  <div>
    <h3>GitHub Actions</h3>
    <ul>
      <li><code>FXCI - Azure</code> builds one untrusted image.</li>
      <li>Trusted images use a separate workflow and gallery.</li>
      <li>Parallel workflows build the alpha or production matrix.</li>
    </ul>
  </div>
</div>

<div class="callout">
  <p>The Azure gallery is authoritative. A job badge can fail after the image was published, or pass with an unintended version.</p>
</div>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

<!--
Always confirm the gallery version, deploymentId tag, and SBOM. Do not trust only the final GitHub Actions badge.
-->

---

# Linux: GCP images

<div class="two-col">
  <div>
    <h3>Build identity</h3>
    <ul>
      <li>Production images use a date in the image name.</li>
      <li>Alpha images use a stable <code>-alpha</code> name.</li>
      <li>The image config sets the Ubuntu source, architecture, scripts, and Taskcluster version.</li>
    </ul>
  </div>
  <div>
    <h3>Trust boundaries</h3>
    <ul>
      <li>Level 1 images publish to <code>taskcluster-imaging</code>.</li>
      <li>Level 3 images publish to a separate trusted project.</li>
      <li>Headless, ARM64, and Wayland images have separate build targets.</li>
    </ul>
  </div>
</div>

<div class="callout">
  <p>Production promotion changes the complete GCE image path in <code>worker-images.yml</code>.</p>
</div>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

---

# OS integration in worker-images

<div class="report-flow" style="--columns: 5">
  <section class="report-stage" data-step="01"><h3>Publish</h3><p>Packer creates the candidate image.</p></section>
  <section class="report-stage" data-step="02"><h3>Resolve</h3><p>The workflow gets its exact name or version.</p></section>
  <section class="report-stage" data-step="03"><h3>Start</h3><p>The Taskcluster hook receives the image.</p></section>
  <section class="report-stage emphasis" data-step="04"><h3>Run</h3><p>Selected Gecko tasks move to compatible alpha pools.</p></section>
  <section class="report-stage" data-step="05"><h3>Report</h3><p>Task results return to GitHub Actions.</p></section>
</div>

<ul class="compact" style="margin-top: 28px">
  <li>The task graph copies the curated Gecko OS integration task set.</li>
  <li>It replaces each production worker type with an image-compatible <code>-alpha</code> worker type.</li>
  <li>It runs source, startup, test, mochitest, browsertime, and web-platform task kinds where they apply.</li>
  <li>The GitHub job waits for the Taskcluster group and links each task result.</li>
</ul>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

<!--
The workflow sends an image name to the Taskcluster hook. The worker-images taskgraph finds the alpha pool that uses that image. It then copies the selected Gecko tasks to that pool.
-->

---

# OS integration in fxci-config

<div class="report-flow" style="--columns: 5">
  <section class="report-stage" data-step="01"><h3>Request</h3><p>Comment <code>/taskcluster integration</code>.</p></section>
  <section class="report-stage" data-step="02"><h3>Stage</h3><p>Apply the PR configuration to Taskcluster staging.</p></section>
  <section class="report-stage" data-step="03"><h3>Limit</h3><p>Find only the worker pools changed by the PR.</p></section>
  <section class="report-stage emphasis" data-step="04"><h3>Run</h3><p>Copy selected Gecko tasks and artifacts.</p></section>
  <section class="report-stage" data-step="05"><h3>Report</h3><p>Post the task results as PR checks.</p></section>
</div>

<div class="two-col" style="margin-top: 30px">
  <div>
    <h3>What it tests</h3>
    <p>The proposed pool and image binding from the PR, not only the image artifact.</p>
  </div>
  <div>
    <h3>How it limits work</h3>
    <p><code>tc-admin diff</code> finds changed pools. The task graph skips tests for pools that did not change.</p>
  </div>
</div>

<div class="callout">
  <p>Firefox build artifacts come from Firefox CI. The selected tests run in Taskcluster staging against the PR configuration.</p>
</div>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-releng/fxci-config">mozilla-releng/fxci-config</a></p>

<!--
This path catches mapping and worker-pool errors that a worker-images build cannot catch. The PR reports results through GitHub checks-v1.
-->

---

# OS integration is the release gate

<div class="surface-grid">
  <div class="card step"><h3>Image checks</h3><p>Confirm the expected OS state, software, services, and Taskcluster components.</p></div>
  <div class="card step"><h3>worker-images</h3><p>Run the curated Gecko OS integration set on the matching alpha pools.</p></div>
  <div class="card step"><h3>fxci-config</h3><p>Run OS integration against the pool and image binding proposed in the PR.</p></div>
</div>

<div class="callout">
  <p>Proceed when the required OS integration jobs pass and no new image-specific permanent failure remains.</p>
</div>

<!--
The current jobs copy a curated mozilla-central OS integration task set. RelOps does not run every Tier 1 task as a routine image-release gate.
-->

---

# How we decide to deploy

<div class="rule">OS integration must pass without a new permanent failure caused by the image.</div>

<ul>
  <li>Run the worker-images checks on the matching alpha pool.</li>
  <li>Run <code>/taskcluster integration</code> on the <code>fxci-config</code> PR.</li>
  <li>Compare failures with the production pool or another control.</li>
  <li>Record an existing Gecko failure or known intermittent that is not caused by the image.</li>
</ul>

<div class="callout stop">
  <p>A repeatable failure that occurs only on the candidate image blocks deployment.</p>
</div>

---

# Classify each failure before release

<div class="surface-grid">
  <div class="card step"><h3>1 · Repeat</h3><p>Re-run the failed task to determine whether the result is repeatable.</p></div>
  <div class="card step"><h3>2 · Control</h3><p>Run the same task on the production pool or another known-good environment.</p></div>
  <div class="card step"><h3>3 · Decide</h3><p>Record an existing failure. Block a permanent failure that is specific to the candidate.</p></div>
</div>

<div class="callout">
  <p>The question is not “did one task turn red?” The question is “did this image create a permanent failure?”</p>
</div>

---

# Promotion is one small config change

<div class="report-flow" style="--columns: 5">
  <section class="report-stage" data-step="01"><h3>Verify</h3><p>Use the image that passed its build checks.</p></section>
  <section class="report-stage" data-step="02"><h3>Bind</h3><p>Open the <code>fxci-config</code> PR.</p></section>
  <section class="report-stage emphasis" data-step="03"><h3>Integrate</h3><p>Run OS integration against the proposed binding.</p></section>
  <section class="report-stage" data-step="04"><h3>Merge</h3><p>Make the configuration active.</p></section>
  <section class="report-stage" data-step="05"><h3>Replace</h3><p>New VMs use the new image binding.</p></section>
</div>

<div class="two-col" style="margin-top: 34px">
  <div class="card"><h3>Windows</h3><p>Change <code>version</code> and <code>deployment_id</code> together.</p></div>
  <div class="card"><h3>Linux</h3><p>Change the full dated GCE image path for each trust level that moved.</p></div>
</div>

<div class="callout">
  <p>The <code>worker-images.yml</code> diff is the release manifest. Change only artifacts that were built and validated.</p>
</div>

<p class="source-link">Canonical repository: <a href="https://github.com/mozilla-releng/fxci-config">mozilla-releng/fxci-config</a></p>

---

# When a CI result changes after an image rollout

RelOps posts each rollout in <code>#relops</code>. Use that release record to check whether a task ran before or after the image change.

<div class="signal-grid">
  <div class="card"><h3>Start with the task</h3><p>Save the task link, start time, worker pool, and worker identity.</p></div>
  <div class="card"><h3>Find the rollout</h3><p>The Slack changelog names the affected worker families and the release time.</p></div>
  <div class="card"><h3>Inspect the release</h3><p>The <code>fxci-config</code> PR identifies the image. The SBOM and release notes identify its contents.</p></div>
  <div class="card"><h3>Compare results</h3><p>Compare retries and the same test on the previous image or another known-good pool.</p></div>
</div>

<div class="callout">
  <p>Share the task links and whether the failure repeats. This evidence helps separate an image change from a Gecko change.</p>
</div>

---

# A cloud rollout is gradual

<div class="signal-grid">
  <div class="card"><h3>Existing VMs</h3><p>Workers that already exist can finish their normal life with the previous image.</p></div>
  <div class="card"><h3>New VMs</h3><p>Workers created after the configuration change use the new image binding.</p></div>
  <div class="card"><h3>Demand sets the pace</h3><p>A busy pool changes faster because Taskcluster creates more workers.</p></div>
  <div class="card"><h3>Results can overlap</h3><p>During the rollout, similar tasks can run on old and new image versions.</p></div>
</div>

<div class="callout">
  <p>Use the worker image identity when you compare results. The merge time alone does not show which image ran a task.</p>
</div>

---

# Cloud images and hardware are different

<table class="compare">
  <thead><tr><th>Topic</th><th>Cloud workers</th><th>Hardware workers</th></tr></thead>
  <tbody>
    <tr><td>Deployment unit</td><td>Immutable Azure or GCP image version</td><td>Persistent host and its Puppet role</td></tr>
    <tr><td>Apply a change</td><td>Provision a new VM from a new image binding</td><td>Converge Puppet at boot, or redeploy the host</td></tr>
    <tr><td>Release control</td><td><code>fxci-config/worker-images.yml</code></td><td>Role data and platform deployment configuration</td></tr>
    <tr><td>Validation</td><td>OS integration on alpha and staging pools</td><td>Configuration tests, test hosts, and pool-specific checks</td></tr>
    <tr><td>Rollout</td><td>New VMs replace old VMs as demand changes</td><td>Existing hosts update or reimage in place</td></tr>
    <tr><td>Rollback</td><td>Restore the previous image binding</td><td>Revert configuration and reconverge or reimage</td></tr>
  </tbody>
</table>

<div class="callout">
  <p>Both paths use Puppet and Taskcluster. The artifact lifecycle and release gate are different.</p>
</div>

---

# What we are improving next

<div class="surface-grid">
  <div class="card step"><h3>More coverage</h3><p>Add Windows Server 2025 builders, prepare Ubuntu 26.04, and add OS integration for more Linux pools.</p></div>
  <div class="card step"><h3>Better release records</h3><p>Complete Linux SBOMs, then add a common CycloneDX record for each supported operating system.</p></div>
  <div class="card step"><h3>Fewer handoffs</h3><p>Create promotion pull requests automatically and produce one change record across the image repositories.</p></div>
</div>

<div class="callout">
  <p>This work is at different stages. The goal is to test more platforms and make each release easier to trace.</p>
</div>

<!--
More coverage: RELOPS-2408, RELOPS-2410, RELOPS-2465, RELOPS-1200, and RELOPS-1184.
Release records: RELOPS-2504 and RELOPS-2395.
Fewer handoffs: RELOPS-1268, RELOPS-1588, and the RelOps Herald POC in RELOPS-2388.
-->

---

# Agent-ready image repositories

Claude Code, Codex, and OpenCode are the coding agents we use today. The repository setup is not complete.

<div class="surface-grid" style="margin-top: 22px">
  <div class="card"><h3><code>worker-images</code></h3><p>Has <code>AGENTS.md</code>. Its <code>CLAUDE.md</code> imports the same instructions.</p></div>
  <div class="card"><h3><code>fxci-config</code></h3><p>Has <code>AGENTS.md</code>. Its <code>CLAUDE.md</code> imports the same instructions.</p></div>
  <div class="card"><h3><code>ronin_puppet</code></h3><p>Has <code>CLAUDE.md</code>, but no <code>AGENTS.md</code> on the default branch.</p></div>
</div>

<div class="callout">
  <p>The shared <a href="https://github.com/mozilla-platform-ops/agent-skills"><code>production-image-deploy</code> skill</a> is installed separately. Next, add <code>AGENTS.md</code> to <code>ronin_puppet</code>, link the shared skills, and keep the release rules current.</p>
</div>

<!--
Codex and OpenCode read AGENTS.md. Claude Code reads CLAUDE.md; the worker-images and fxci-config CLAUDE.md files contain @AGENTS.md.
None of the three repositories contains a repository-owned SKILL.md. The canonical production-image-deploy skill lives in mozilla-platform-ops/agent-skills.
The current worker-images AGENTS.md still describes Tier 1 as the release bar. Update it to match the current OS integration process before we call the guidance complete.
-->

---

# Links and questions

Start here: [Mozilla Platform Operations](https://github.com/mozilla-platform-ops/) · [agent-skills](https://github.com/mozilla-platform-ops/agent-skills)

- [mozilla-platform-ops/worker-images](https://github.com/mozilla-platform-ops/worker-images)
- [mozilla-platform-ops/ronin_puppet](https://github.com/mozilla-platform-ops/ronin_puppet)
- [mozilla-releng/fxci-config](https://github.com/mozilla-releng/fxci-config)
- [worker-images OS integration workflow](https://github.com/mozilla-platform-ops/worker-images/blob/main/.github/workflows/os-integration.yml)
- [fxci-config integration task definition](https://github.com/mozilla-releng/fxci-config/blob/main/taskcluster/kinds/integration-test/kind.yml)
- [Taskcluster Worker-Runner deployment](https://docs.taskcluster.net/docs/reference/workers/worker-runner/deployment)
- [Firefox Try documentation](https://firefox-source-docs.mozilla.org/tools/try/)
- [Hardware platform configuration deck](../2026-hardware-platform-configuration-managment-overview/#/1)
- [RELOPS-2499](https://mozilla-hub.atlassian.net/browse/RELOPS-2499)

<div class="callout">
  <p>Slack: <code>#relops</code></p>
</div>
