import CoreImage
import Foundation
import Vision

enum CutoutError: Error {
  case missingArguments
  case noObservation
  case noColorSpace
}

if CommandLine.arguments.count != 3 {
  throw CutoutError.missingArguments
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let handler = VNImageRequestHandler(url: inputURL)
let request = VNGenerateForegroundInstanceMaskRequest()

try handler.perform([request])

guard let observation = request.results?.first else {
  throw CutoutError.noObservation
}

let maskedBuffer = try observation.generateMaskedImage(
  ofInstances: observation.allInstances,
  from: handler,
  croppedToInstancesExtent: false
)

let image = CIImage(cvPixelBuffer: maskedBuffer)
let context = CIContext()

guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
  throw CutoutError.noColorSpace
}

try context.writePNGRepresentation(
  of: image,
  to: outputURL,
  format: .RGBA8,
  colorSpace: colorSpace
)
