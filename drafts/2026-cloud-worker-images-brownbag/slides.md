---
theme: default
title: "Cloud Worker Images: How Firefox CI Gets Its Test Environment"
---

<div class="title-slide">
  <div>
    <p class="eyebrow">Mozilla Release Operations</p>
    <h1>Cloud Worker Images<br><span>for Firefox CI</span></h1>
    <p class="subtitle">How RelOps builds, tests, and releases Windows Azure and Linux GCP images.</p>
    <p class="title-meta">September 2026</p>
    <p class="title-source"><a href="https://github.com/mozilla-platform-ops/">github.com/mozilla-platform-ops</a></p>
  </div>
</div>

<!--
This talk explains the cloud images that provide the operating system and tools for many Firefox CI tasks. The existing hardware deck covers persistent hosts. This deck covers short-lived Azure and GCP workers.
-->

---

# Why Firefox developers should care

A worker image is part of the Firefox test environment. An image change can change a result without a Gecko change.

<div class="signal-grid">
  <div class="card"><h3>Graphics and media</h3><p>Drivers, codecs, audio devices, display settings, and hardware acceleration.</p></div>
  <div class="card"><h3>Timing and performance</h3><p>VM size, storage, timers, power settings, and background services.</p></div>
  <div class="card"><h3>Build and test tools</h3><p>Compilers, SDKs, runtimes, browsers, Python, and MozillaBuild.</p></div>
  <div class="card"><h3>Task execution</h3><p>Generic Worker, permissions, caches, networking, logs, and cleanup.</p></div>
</div>

<div class="callout">
  <p>If a test fails only on a new image, the image can be the cause. It can also expose a Firefox defect that the old environment did not show.</p>
</div>

---
layout: default
class: system-map-slide
---

<iframe
  src="./cloud-worker-image-system-map.html"
  title="Interactive Firefox CI cloud worker image system map"
  allow="fullscreen"
  style="position: absolute; left: 0; top: 0; width: calc(100% * var(--slidev-slide-scale)); height: calc(100% * var(--slidev-slide-scale)); border: 0; background: #f6f8fb; transform: scale(calc(1 / var(--slidev-slide-scale))); transform-origin: top left"
></iframe>

<!--
This map is the guide for the rest of the talk. Follow it from configuration on the left to Firefox CI on the right. Select a node to trace its connections. The Windows release path rebuilds the image. The Linux release path copies the tested alpha image.
-->

---

# Configure: Three repositories, three roles

<div class="surface-grid">
  <div class="card step"><h3><code>ronin_puppet</code></h3><p>Defines the software, policy, and operating-system state in Windows images.</p></div>
  <div class="card step"><h3><code>worker-images</code></h3><p>Defines Linux images. It also builds and tests both Windows and Linux images.</p></div>
  <div class="card step"><h3><code>fxci-config</code></h3><p>Selects the production image that each Firefox CI worker pool uses.</p></div>
</div>

<div class="callout">
  <p>The map starts with these repositories. Their changes move through build, validation, promotion, and worker provisioning.</p>
</div>

<p class="source-link">Repositories: <a href="https://github.com/mozilla-platform-ops/ronin_puppet">ronin_puppet</a> · <a href="https://github.com/mozilla-platform-ops/worker-images">worker-images</a> · <a href="https://github.com/mozilla-releng/fxci-config">fxci-config</a></p>

---

# Build: Windows images for Azure

<div class="report-flow spacious" style="--columns: 3">
  <section class="report-stage" data-step="01"><h3>Choose the inputs</h3><p><code>worker-images</code> selects the Marketplace base image and a <code>ronin_puppet</code> commit.</p></section>
  <section class="report-stage emphasis" data-step="02"><h3>Build the image</h3><p>GitHub Actions runs Packer. <code>ronin_puppet</code> applies the Windows configuration.</p></section>
  <section class="report-stage" data-step="03"><h3>Publish the version</h3><p>The workflow writes a version to the Azure Compute Gallery and creates its release record.</p></section>
</div>

<div class="callout">
  <p>The Azure gallery version and the <code>deploymentId</code> tag identify the image. Confirm both values and the SBOM.</p>
</div>

<p class="source-link">Repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

---

# Build: Linux images for GCP

<div class="report-flow spacious" style="--columns: 3">
  <section class="report-stage" data-step="01"><h3>Choose the inputs</h3><p><code>worker-images</code> selects Ubuntu, architecture, scripts, and the Taskcluster version.</p></section>
  <section class="report-stage emphasis" data-step="02"><h3>Build the image</h3><p>GitHub Actions runs Packer and the Linux provisioning scripts.</p></section>
  <section class="report-stage" data-step="03"><h3>Publish the image</h3><p>The workflow writes the alpha image to the correct trusted or untrusted GCP project.</p></section>
</div>

<div class="callout">
  <p>Headless, ARM64, and Wayland workers use separate image targets. The image name identifies the target and release.</p>
</div>

<p class="source-link">Repository: <a href="https://github.com/mozilla-platform-ops/worker-images">mozilla-platform-ops/worker-images</a></p>

---

# Candidate: What is in a worker image?

The image contains the operating system and tools that a task uses.

<div class="stack" style="margin-top: 18px">
  <div class="layer"><strong>Operating system</strong><span>Windows or Ubuntu, drivers, services, and system settings.</span></div>
  <div class="layer"><strong>Build and test tools</strong><span>Compilers, SDKs, runtimes, browsers, Python, and MozillaBuild.</span></div>
  <div class="layer"><strong>Task execution</strong><span>Generic Worker, Taskcluster Proxy, Live Log, permissions, and task configuration.</span></div>
  <div class="layer"><strong>Image setup</strong><span>Windows uses <code>ronin_puppet</code>. Linux uses configuration and scripts from <code>worker-images</code>.</span></div>
</div>

<div class="callout">
  <p>Use the image <a href="https://github.com/mozilla-platform-ops/worker-images/tree/main/sboms">SBOM and release notes</a> to see its exact contents. They identify the OS, configuration revision, Taskcluster binaries, packages, and drivers.</p>
</div>

<!--
Worker-Runner starts Generic Worker. Its binary is named start-worker. Taskcluster Worker Manager is a service outside the image. The ticket uses the term cloud-worker, but that term does not name a binary in the image.
-->

---

# Validate: Test the candidate image

<div class="report-flow" style="--columns: 5">
  <section class="report-stage" data-step="01"><h3>Publish</h3><p>Packer creates the candidate image.</p></section>
  <section class="report-stage" data-step="02"><h3>Resolve</h3><p>The workflow gets its exact name or version.</p></section>
  <section class="report-stage" data-step="03"><h3>Start</h3><p>A Taskcluster hook receives the image.</p></section>
  <section class="report-stage emphasis" data-step="04"><h3>Run</h3><p>Selected Gecko tasks run on compatible alpha pools.</p></section>
  <section class="report-stage" data-step="05"><h3>Report</h3><p>Task results return to GitHub Actions.</p></section>
</div>

<ul class="compact" style="margin-top: 28px">
  <li>The task graph copies a selected set of Gecko tasks.</li>
  <li>It replaces each production worker type with a compatible <code>-alpha</code> worker type.</li>
  <li>The set includes source, startup, test, mochitest, browsertime, and web-platform tasks where they apply.</li>
</ul>

<p class="source-link">Workflow: <a href="https://github.com/mozilla-platform-ops/worker-images/blob/main/.github/workflows/os-integration.yml">worker-images OS integration</a></p>

---

# Validate: Test the pool binding

<div class="report-flow" style="--columns: 5">
  <section class="report-stage" data-step="01"><h3>Request</h3><p>Comment <code>/taskcluster integration</code> on the pull request.</p></section>
  <section class="report-stage" data-step="02"><h3>Stage</h3><p>Apply the proposed configuration to Taskcluster staging.</p></section>
  <section class="report-stage" data-step="03"><h3>Limit</h3><p>Find the worker pools changed by the pull request.</p></section>
  <section class="report-stage emphasis" data-step="04"><h3>Run</h3><p>Run selected Gecko tasks on those pools.</p></section>
  <section class="report-stage" data-step="05"><h3>Report</h3><p>Post the results as pull request checks.</p></section>
</div>

<div class="callout">
  <p>This test checks the image and its proposed worker-pool binding. It can find configuration errors that the image build cannot find.</p>
</div>

<p class="source-link">Repository: <a href="https://github.com/mozilla-releng/fxci-config">mozilla-releng/fxci-config</a></p>

---

# Validate: Before production

<div class="surface-grid">
  <div class="card step"><h3>Image checks</h3><p>Confirm the expected OS state, software, services, and Taskcluster components.</p></div>
  <div class="card step"><h3>OS integration</h3><p>Test the candidate image and the proposed worker-pool binding.</p></div>
  <div class="card step"><h3>Tier 1 tasks</h3><p>Run all Tier 1 tasks against the candidate. Use builds from the latest autoland decision task.</p></div>
</div>

<div class="callout stop">
  <p>A candidate-only Tier 1 failure blocks the release. A clear increase in Tier 1 intermittent failures also blocks the release.</p>
</div>

<!--
Use gecko.v2.autoland.latest.taskgraph.decision as the build baseline. Do not use mozilla-central. Compare a failure with the production pool or another control before release.
-->

---

# Promote: Windows rebuilds, Linux copies

<div class="two-col" style="margin-top: 28px">
  <div class="card"><h3>Windows rebuilds</h3><p>Packer creates a production Azure image from the same source revision. The production image is a new build.</p></div>
  <div class="card"><h3>Linux copies</h3><p>GCP copies the tested alpha image to production. It does not rebuild the filesystem.</p></div>
</div>

<div class="report-flow" style="--columns: 3; margin-top: 38px">
  <section class="report-stage" data-step="01"><h3>Bind</h3><p>Update <code>fxci-config/worker-images.yml</code> with the exact production artifact.</p></section>
  <section class="report-stage emphasis" data-step="02"><h3>Test</h3><p>Run OS integration against the proposed production binding.</p></section>
  <section class="report-stage" data-step="03"><h3>Deploy</h3><p>Merge the pull request. New VMs use the new image.</p></section>
</div>

<p class="source-link">Repositories: <a href="https://github.com/mozilla-platform-ops/worker-images">worker-images</a> · <a href="https://github.com/mozilla-releng/fxci-config">fxci-config</a></p>

---

# Run: Create workers and run tasks

<div class="surface-grid">
  <div class="card step"><h3>Select the image</h3><p><code>fxci-config</code> gives each worker pool an exact Azure or GCP image.</p></div>
  <div class="card step"><h3>Create a VM</h3><p>Worker Manager creates a short-lived cloud VM when the pool needs capacity.</p></div>
  <div class="card step"><h3>Run the task</h3><p>Generic Worker starts on the VM and runs the assigned Firefox CI task.</p></div>
</div>

<div class="callout">
  <p>Existing VMs can finish on the old image, so versions can overlap. For an unexpected result, save the task link and worker identity. Then check the <code>fxci-config</code> pull request, the SBOM, and <code>#relops</code>.</p>
</div>

---

# Cloud images and hardware are different

<table class="compare">
  <thead><tr><th>Topic</th><th>Cloud workers</th><th>Hardware workers</th></tr></thead>
  <tbody>
    <tr><td>Deployment unit</td><td>Immutable Azure or GCP image version</td><td>Persistent host and its Puppet role</td></tr>
    <tr><td>Apply a change</td><td>Create a VM from a new image binding</td><td>Converge Puppet or redeploy the host</td></tr>
    <tr><td>Release control</td><td><code>fxci-config/worker-images.yml</code></td><td>Role data and platform deployment configuration</td></tr>
    <tr><td>Validation</td><td>OS integration on alpha and staging pools</td><td>Configuration tests, test hosts, and pool checks</td></tr>
    <tr><td>Rollout</td><td>New VMs replace old VMs as demand changes</td><td>Existing hosts update or reimage in place</td></tr>
    <tr><td>Rollback</td><td>Restore the previous image binding</td><td>Revert configuration and reconverge or reimage</td></tr>
  </tbody>
</table>

<div class="callout">
  <p>Both systems use Puppet and Taskcluster. Their release and rollout methods are different.</p>
</div>

---

# What we are improving next

<div class="surface-grid">
  <div class="card step"><h3>More coverage</h3><p>Add Windows Server 2025 builders, prepare Ubuntu 26.04, and add OS integration for more Linux pools.</p></div>
  <div class="card step"><h3>Better release records</h3><p>Complete Linux SBOMs. Add one CycloneDX record for each supported operating system.</p></div>
  <div class="card step"><h3>Fewer handoffs</h3><p>Create promotion pull requests automatically. Produce one change record across the image repositories.</p></div>
</div>

<div class="callout">
  <p>The work is at different stages. The goal is more test coverage and a release that is easier to trace.</p>
</div>

<!--
More coverage: RELOPS-2408, RELOPS-2410, RELOPS-2465, RELOPS-1200, and RELOPS-1184.
Release records: RELOPS-2504 and RELOPS-2395.
Fewer handoffs: RELOPS-1268, RELOPS-1588, and the RelOps Herald POC in RELOPS-2388.
-->

---

# Coding agents have a common entry point

Claude Code, Codex, and OpenCode can use the same repository instructions.

<div class="surface-grid" style="margin-top: 22px">
  <div class="card"><h3><code>worker-images</code></h3><p><a href="https://github.com/mozilla-platform-ops/worker-images/blob/main/AGENTS.md"><code>AGENTS.md</code></a> covers image builds and releases. <code>CLAUDE.md</code> imports it.</p></div>
  <div class="card"><h3><code>fxci-config</code></h3><p><a href="https://github.com/mozilla-releng/fxci-config/blob/main/AGENTS.md"><code>AGENTS.md</code></a> covers configuration and validation. <code>CLAUDE.md</code> imports it.</p></div>
  <div class="card"><h3><code>ronin_puppet</code></h3><p><a href="https://github.com/mozilla-platform-ops/ronin_puppet/blob/master/AGENTS.md"><code>AGENTS.md</code></a> covers Puppet structure and tests. <code>CLAUDE.md</code> imports it.</p></div>
</div>

<div class="callout">
  <p>The base setup is complete. Operational skills, such as <a href="https://github.com/mozilla-platform-ops/agent-skills/tree/main/skills/production-image-deploy"><code>production-image-deploy</code></a>, stay in the shared <code>agent-skills</code> repository.</p>
</div>

<!--
All three default branches contain AGENTS.md. Each CLAUDE.md contains @AGENTS.md. ronin_puppet completed this setup in PR #1345 on 2026-08-20.
Codex and OpenCode read AGENTS.md. Claude Code reads CLAUDE.md, which imports AGENTS.md in these repositories.
None of the three repositories contains a repository-owned SKILL.md. The canonical production-image-deploy skill lives in mozilla-platform-ops/agent-skills.
-->

---

# Links and questions

Start here: [Mozilla Platform Operations](https://github.com/mozilla-platform-ops/) · [agent-skills](https://github.com/mozilla-platform-ops/agent-skills)

- [mozilla-platform-ops/worker-images](https://github.com/mozilla-platform-ops/worker-images)
- [mozilla-platform-ops/ronin_puppet](https://github.com/mozilla-platform-ops/ronin_puppet)
- [mozilla-releng/fxci-config](https://github.com/mozilla-releng/fxci-config)
- [Interactive cloud worker image system map](./cloud-worker-image-system-map.html)
- [worker-images OS integration workflow](https://github.com/mozilla-platform-ops/worker-images/blob/main/.github/workflows/os-integration.yml)
- [fxci-config integration task definition](https://github.com/mozilla-releng/fxci-config/blob/main/taskcluster/kinds/integration-test/kind.yml)
- [Taskcluster Worker-Runner deployment](https://docs.taskcluster.net/docs/reference/workers/worker-runner/deployment)
- [Firefox Try documentation](https://firefox-source-docs.mozilla.org/tools/try/)
- [Hardware platform configuration deck](../2026-hardware-platform-configuration-managment-overview/#/1)
- [RELOPS-2499](https://mozilla-hub.atlassian.net/browse/RELOPS-2499)

<div class="callout">
  <p>Slack: <code>#relops</code></p>
</div>
