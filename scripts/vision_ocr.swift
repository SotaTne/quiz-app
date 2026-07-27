import Foundation
import Vision
import ImageIO

struct OCRLine: Codable {
    let text: String
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let confidence: Float
}

struct OCRFrame: Codable {
    let path: String
    let width: Int
    let height: Int
    let lines: [OCRLine]
    let error: String?
}

func recognize(_ path: String) -> OCRFrame {
    let url = URL(fileURLWithPath: path)
    guard
        let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        return OCRFrame(path: path, width: 0, height: 0, lines: [], error: "画像を読み込めません")
    }

    let width = image.width
    let height = image.height
    var found: [OCRLine] = []
    var requestError: String?
    let request = VNRecognizeTextRequest { request, error in
        if let error {
            requestError = error.localizedDescription
            return
        }
        let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
        found = observations.compactMap { observation in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            return OCRLine(
                text: candidate.string,
                x: box.origin.x,
                y: box.origin.y,
                width: box.size.width,
                height: box.size.height,
                confidence: candidate.confidence
            )
        }.sorted {
            if abs($0.y - $1.y) > 0.02 { return $0.y > $1.y }
            return $0.x < $1.x
        }
    }
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["ja-JP", "en-US"]

    do {
        try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    } catch {
        requestError = error.localizedDescription
    }
    return OCRFrame(path: path, width: width, height: height, lines: found, error: requestError)
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for path in CommandLine.arguments.dropFirst() {
    let result = recognize(path)
    if let data = try? encoder.encode(result), let json = String(data: data, encoding: .utf8) {
        print(json)
    }
}
