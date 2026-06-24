---
theme: default
title: 2026 hardware platform deployment overview
---

# hardware platform configuration managment overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# How do we configure our hardware hosts?

- Mac: Puppet/OpenVox
- Linux: Puppet/OpenVox
- Windows Puppet/OpenVox
- Android:
  - hosts: vendor-managed
  - execution environment: via Dockerfile for Bitbar or shell scripts for LambdaTest

---

# Puppet/OpenVox

- Puppet: `foundation for infrastructure automation`
  - define host state in a domain specific language (DSL)
  - links
    - https://www.puppet.com/
    - https://voxpupuli.org/openvox/
- OpenVox is a free opensource fork of Puppet (recently acquired by Perforce and license was changed)
- our Puppet repository: https://github.com/mozilla-platform-ops/ronin_puppet

---

# Ronin Puppet

- Why `ronin` (masterless) Puppet?
  - Masterless puppet used to be the default.
    - Hosts would check in with coordination server regularly.
  - Masterless is better fit for our fleet management style (and creating cloud VMs).
    - Hosts individually control when they 'converge' on the desired configuration.
      - Our hosts converge after every TC task/reboot (Mac and Linux) or when a ronin-puppet change is detected (Windows).

---

# Roles: How hosts determine their configuration

- Mac: 
- Linux: /etc/puppet/role
- Windows

---

Android: TBD

- Bitbar
- Lambdatest
