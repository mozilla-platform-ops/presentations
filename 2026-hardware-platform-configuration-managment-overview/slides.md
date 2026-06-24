---
theme: default
title: 2026 hardware platform deployment overview
---

# hardware platform configuration managment overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# DRAFT SLIDE / Requested questions (if answered, note slide number)
 - How are they configured
 - how frequently is the configuration deployed
 - how often are they refreshed or reimaged
 - What do we enable vs not enable.
 - If we want to log into a perf worker with screen sharing is it possible
   - what about shell
   - Are the perf workers self-checked regularly?
 - How much time does it take to deploy a configuration change


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
    - Hosts individually control when they 'converge' on the desired configuration.
      - Our hosts converge after every TC task/reboot (Mac and Linux) or when a ronin-puppet change is detected (Windows).
- Desired state is verified via ServerSpec/InSpec tests.
  - Tests are run at PR merge on VMs, not continuously on production hosts.

---

# Roles: How hosts determine their configuration

- Mac: TBD
- Linux: /etc/puppet/role
- Windows: TBD

---

Android: TBD

- Bitbar
- Lambdatest
