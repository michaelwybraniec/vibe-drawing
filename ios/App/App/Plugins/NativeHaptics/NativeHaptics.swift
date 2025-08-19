import Foundation
import Capacitor
import CoreHaptics

@objc(NativeHaptics)
public class NativeHaptics: CAPPlugin {
    private var engine: CHHapticEngine?
    private var player: CHHapticAdvancedPatternPlayer?

    @objc override public func load() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        do {
            self.engine = try CHHapticEngine()
            try self.engine?.start()
        } catch {
            print("Haptics engine error: \(error)")
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        let intensity = min(max(call.getFloat("intensity") ?? 0.5, 0.0), 1.0)
        guard let engine = self.engine else { call.resolve(); return }
        do {
            let ev = CHHapticEvent(eventType: .hapticContinuous, parameters: [
                CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)
            ], relativeTime: 0, duration: 10.0)
            let pattern = try CHHapticPattern(events: [ev], parameters: [])
            self.player = try engine.makeAdvancedPlayer(with: pattern)
            try self.player?.start(atTime: CHHapticTimeImmediate)
            call.resolve()
        } catch {
            call.reject("start failed: \(error)")
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        let intensity = min(max(call.getFloat("intensity") ?? 0.5, 0.0), 1.0)
        do {
            try self.player?.sendParameters([
                CHHapticDynamicParameter(parameterID: .hapticIntensityControl, value: intensity, relativeTime: 0)
            ], atTime: 0)
            call.resolve()
        } catch {
            call.reject("update failed: \(error)")
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        do {
            try self.player?.stop(atTime: CHHapticTimeImmediate)
            self.player = nil
            call.resolve()
        } catch {
            call.reject("stop failed: \(error)")
        }
    }
}
