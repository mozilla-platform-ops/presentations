---
theme: default
title: hardware platform configuration managment overview
---

# hardware platform configuration managment overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# Overview / TLDR / Requested questions index
  - How are they configured? [Slides 3-5](/3)
  - How frequently is the configuration deployed? [Slide 6](/6)
  - How often are they refreshed or reimaged? [Slide 6](/6)
  - What do we enable vs not enable? [Slide 8](/8)
  - If we want to log into a worker with screen sharing is it possible?
    - What about SSH/Shell?
  - Are the perf workers self-checked regularly?
  - How much time does it take to deploy a configuration change?

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# How do we configure our hardware hosts?

- Mac: Puppet/OpenVox
- Linux: Puppet/OpenVox
- Windows: Puppet/OpenVox
- Android:
  - requirements doc for android hardware testing vendors (infrastructure and devices): LINK INCOMING
  - hosts (phones): vendor-managed
    - effort to codify requirements for hosts: JIRA LINK INCOMING
  - execution environment
    - via Dockerfile for Bitbar
    - via shell scripts for LambdaTest

---

# Puppet/OpenVox

- Puppet: `foundation for infrastructure automation`
  - process
    - define the desired host state in Puppet's domain specific language (DSL)
    - run Puppet to make the host match the desired configuration
  - links
    - https://www.puppet.com/
    - https://voxpupuli.org/openvox/
- OpenVox is a free opensource fork of Puppet (recently acquired by Perforce and license was changed)
- RelOps' Puppet repository: https://github.com/mozilla-platform-ops/ronin_puppet

---

# Ronin Puppet

- Why `ronin` (masterless) Puppet?
  - Masterless puppet used to be the default.
    - Hosts would check in with coordination server regularly.
  - Masterless is better fit for our fleet management style (and creating cloud VMs).
- Desired state is verified via ServerSpec/InSpec tests.
  - Tests are run at PR merge on VMs, not continuously on production hosts.

---

# How frequently do hosts update their configuration?

- Hosts individually control when they apply the configuration (aka 'converge' on the desired configuration).
  - Mac and Linux: After every TC task/reboot, the host converges in Puppet. Machines are not regularly reimaged.
  - Windows: When a ronin-puppet change is detected, the host is reimaged and the Puppet configuration is applied. Hosts do not converge in between TC task runs.


---

# Roles: How hosts determine their configuration

- Mac: TBD
- Linux: /etc/puppet/role
- Windows: TBD

---

# What do we enable vs not enable?

- Generally:
  - If it's been disabled in the past, we usually will disable it in future platform versions (Ubuntu 22.04 -> 24.04).
  - If someone asks for something to be disabled, we will usually disable it.
- In the past, we've tried to keep systems 'user-like'.
  - We wouldn't fully strip the systems services. We were told more user-like was the goal.
- Going forward, we're open to whatever is desired (e.g. more barebones stripped-down systems and also user-like systems)
  - alternate configurations are additional overhead for us manage/test/update
  - splits pool resources also


---

Android: TBD

- Bitbar
- Lambdatest
