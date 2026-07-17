---
theme: default
title: hardware platform configuration management overview
---

# hardware platform configuration management overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# Questions we'll answer
  - How are they configured? [Slides 3-6](/3)
  - How frequently is the configuration deployed? [Slide 7](/7)
  - How often are they refreshed or reimaged? [Slide 7](/7)
  - What do we enable vs not enable? [Slide 8](/8)
  - If we want to log into a worker with screen sharing is it possible? [Slide 9](/9)
  - Are the workers self-checked regularly? [Slide 10](/10)
  - How much time does it take to deploy a configuration change? [Slides 13-14](/13)

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# How do we configure our hardware hosts?

TLDR: Puppet

- Mac/Linux
  - Deploy a base OS image, then converge with Puppet from `master` (not commit-pinned).
- Windows
  - Deploy an image created with Puppet and pinned to a specific commit.
- Android
  - A separate vendor-managed and script-based model. See [Slide 15](/15)

---

# Puppet and ronin_puppet

- Puppet defines the desired host state and makes the host match it.
  - We define that state in Puppet's domain specific language (DSL).
  - Hosts apply configuration based on their role.
    - Each role usually corresponds to a Taskcluster worker pool.
    - For imaging-based workflows, it defines a specific OS and configuration.
  - We verify configuration with ServerSpec/InSpec tests at PR merge on GitHub and Azure VMs.
- Ronin Puppet is our masterless Puppet repository.
  - Hosts specify their role rather than receiving it from a central Puppet server.
  - This fits both fleet management and cloud-image creation.
  - https://github.com/mozilla-platform-ops/ronin_puppet

---

# How Mac/Linux choose configuration

- Puppet roles.
  - Each role maps to a file in ronin-puppet.
    - https://github.com/mozilla-platform-ops/ronin_puppet/tree/master/modules/roles_profiles/manifests/roles
  - Each role maps to a TC worker type.
- We place a file specifying which role (/etc/puppet_role)
  - 27 Mac and 6 Linux roles in ronin_puppet
  - e.g. `gecko_t_linux_2404_talos` -> `releng-hardware/gecko-t-linux-talos-2404`
  - e.g. `gecko_t_osx_1500_m4` -> `releng-hardware/gecko-t-osx-1500-m4`

---

# How Windows choose configuration

- Puppet roles.
  - Each role maps to a TC worker type.
- The worker reads its configuration from the per-pool source of truth file, starting at image deployment.
  - https://github.com/mozilla-platform-ops/worker-images/blob/main/provisioners/windows/MDC1Windows/pools.yml
  - Each pool lists its nodes and pins a `hash` (ronin_puppet commit).
- 2 main Windows TC pools, each mapping to a ronin_puppet role:
  - e.g. `win116424h2hw` -> `win11-64-24h2-hw`
  - e.g. `win116424h2hwref` -> `win11-64-24h2-hw-ref`

---

# How frequently do hosts update their configuration?

- Hosts control when they apply the configuration.
  - Mac and Linux: After every TC task/reboot, the host converges in Puppet. Machines are not regularly reimaged.
  - Windows: Configuration is locked to a ronin_puppet commit until the pool's data changes. Hosts do not converge in between TC task runs.
    - Checks for configuration details on image deployment, then every 2 hours after.
      - Redeploys itself when idle, or on the next reboot after task completion.
- We can also force hosts to update.

---

# What is disabled on the hosts?

- We can support either user-like or stripped-down systems.
  - Each alternate configuration adds overhead to manage, test, and update, and splits resources.
- Generally,
  - if it's been disabled in the past, we usually will disable it in future platform versions.
    - e.g. Ubuntu 22.04 -> 24.04
  - if someone asks for something to be disabled, we will usually disable it.
- In the past, we've tried to keep systems 'user-like'.
  - We wouldn't fully strip the systems services. We were told more user-like was the goal.

---

# Can I get screen sharing or shell access?

- Yes.
  - SSH/Shell: yes
  - Screen sharing/VNC/RDC: yes
    - Windows: available on request; not enabled/installed in the default config.
- Considerations
  - If you're going to be changing things, we usually want to put the host into a dedicated pool.
  - If you're going to change things, we will usually reimage and redeploy the host when done.
  - We have limited resources (e.g. we can't have 30 loaners in a pool of 100 hosts).
- File a RelOps JIRA ticket for a 'loaner'.
  - See https://mozilla-hub.atlassian.net/wiki/x/AQDvpw.


---

# Are the workers self-checked regularly?

- Yes, we have checks that prevent a worker from registering with Taskcluster.
  - Mac/Linux
    - Linux: Puppet apply success (Mac runs at startup, but doesn't gate on success).
    - Free disk space (10GB Linux, 20GB Mac).
  - Windows
    - Self-checks its configuration, plus other checks:
      - screen resolution / refresh rate
      - generic-worker is running
    - On finding an issue, reboots; if a reboot doesn't resolve it, redeploys itself.
- We monitor more things, just non-gating metrics or external sources. See the next slides.

<!--
Ask the audience: what specifically do they want to know about self-checks?
-->


---

# Things we monitor

Part 1

## Host metrics
- Collected via Icinga, pushed to Influx, and displayed in Grafana.
  - free disk space
  - Taskcluster generic-worker binary state
  - CPU performance
  - view at https://yardstick.mozilla.org/dashboards/f/cffmfl1sfr1moe/fxci-hardware-workers
- Future
  - We're working on rolling out more device benchmarking.
    - Currently just CPU performance on Windows.

---

# Things we monitor

Part 2

## Taskcluster metrics

- Logged in Prometheus and displayed and alerted on in Grafana.
  - Main Dashboard: https://yardstick.mozilla.org/goto/dfsbwlyi76l8gb?orgId=1
    - worker metrics: active, running, and quarantined workers
    - queue metrics: task counts
  - Alerts are mostly for android pools currently.
    - https://yardstick.mozilla.org/goto/efsbwpzz9srnkf?orgId=1
- Future
  - Pool Classifier (https://pool-classifier.relops.mozilla.com/) calculates worker and worker pool success rates. Could start graphing and alerting in Grafana.

---

# How much time does it take to deploy a configuration change?

Mac and Linux — ≤4 hours in the optimal case

- create PR (1 hour, can vary)
- test PR (1 hour, can vary)
  - automated PR testing (1 hour)
  - (optional) manual testing (varies)
- review and merge PR (1 hour)
- deploy PR (1 hour, can vary)
  - pools with fewer tasks can take longer, but next task will always pick up the change.
    - manual Puppet run can be done if absolutely necessary.

<!--

details/caveats on timing:

- create PR (1 hour, can vary)
- test PR (1 hour, can vary)
- review and merge PR (1 hour)
- deploy PR (1 hour, can vary)
  - low risk: immediately land to master, hosts will pick up change after next reboot/task completion.
  - higher risk:
    - we may roll the change out slowly via override files.
    - we may deploy the change to a test TC worker pool and run larger sets of tests
- total: optimal case: 4 hours or less

-->

---

# How much time does it take to deploy a configuration change?

Windows — ≤6 hours in the optimal case

- create PR (1 hour, can vary)
- test PR (1 hour, can vary)
  - automated PR testing (1 hour)
  - (optional) manual testing (varies)
  - try push verification (~2 hours)
- review and merge PR (1 hour)
- deploy PR (0 to 2 hours)
  - bump the pool `hash` in `pools.yml`; worker picks up the change and redeploys.
  - if needed, an immediate redeployment of all workers in a pool can be forced.
---

# Android: a different configuration model

and their Docker environments

  - hosts (phones): mostly vendor-managed but some things can be configured in our startup scripts
    - requirements document: https://docs.google.com/document/d/1H0oQYkxWBrYQTWb5BFIrShrtcm0_VOB-cSInjLPx-tM/edit
      - new requirements continue to be added
  - execution environment (Docker, where the TC client/job runs)
    - via Dockerfile for Bitbar (https://github.com/mozilla-platform-ops/mozilla-bitbar-docker)
    - via shell scripts for LambdaTest (https://github.com/mozilla-platform-ops/mozilla-bitbar-devicepool/tree/master/mozilla_bitbar_devicepool/lambdatest/user_scripts)

---

# Q&A / Links

- Contact Info
  - Slack: #relops
  - Loaner requests: https://mozilla-hub.atlassian.net/wiki/x/AQDvpw
- Links
  - confluence: https://mozilla-hub.atlassian.net/wiki/spaces/ROPS/overview
  - grafana dashboards: https://yardstick.mozilla.org/dashboards/f/edtgaia1z6waoe
  - github: https://github.com/mozilla-platform-ops/
    - https://github.com/mozilla-platform-ops/ronin_puppet
    - https://github.com/mozilla-platform-ops/fleetbench
